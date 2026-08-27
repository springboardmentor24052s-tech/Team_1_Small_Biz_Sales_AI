import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.db.session import Base
from backend.app.models.product import Product
from backend.app.models.customer import Customer
from backend.app.services.recommendation_service import (
    compute_category_affinity,
    compute_customer_tier_fit,
    compute_inventory_weight,
    compute_popularity_score,
    get_product_recommendations,
    get_recommendation_analytics,
)

class TestRecommendationEngine(unittest.TestCase):
    def setUp(self):
        # Setup in-memory SQLite database for fast unit testing
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db = Session()

        # Seed sample product test dataset
        self.p1 = Product(id="SKU-501", name="AI POS Terminal X1", category="Terminals", stock=68, min_stock=15, unit_price=499.00, sales_count=420, growth=24.0)
        self.p2 = Product(id="SKU-902", name="Thermal Receipt Paper", category="Supplies", stock=4, min_stock=25, unit_price=45.00, sales_count=550, growth=15.0)
        self.p3 = Product(id="SKU-441", name="Bluetooth Barcode Scanner", category="Hardware", stock=25, min_stock=15, unit_price=129.00, sales_count=280, growth=12.0)
        self.db.add_all([self.p1, self.p2, self.p3])

        # Seed sample customer test dataset
        self.c1 = Customer(id="CUST-001", name="Apex Logistics Inc", tier="Enterprise Platinum", lifetime_value=142500.0, churn_risk=0.12)
        self.c2 = Customer(id="CUST-002", name="GreenBite Organics", tier="Silver Tier", lifetime_value=19800.0, churn_risk=0.10)
        self.db.add_all([self.c1, self.c2])

        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_category_affinity(self):
        # Terminals and Supplies have high cross-sell affinity
        score = compute_category_affinity("Supplies", "Terminals")
        self.assertEqual(score, 1.0)

        # Same category reorder
        same_score = compute_category_affinity("Terminals", "Terminals")
        self.assertEqual(same_score, 0.75)

    def test_customer_tier_fit(self):
        # Platinum customer fits high-value terminal
        score_plat = compute_customer_tier_fit(self.p1, self.c1)
        self.assertEqual(score_plat, 0.95)

        # Silver customer fits supplies
        score_silv = compute_customer_tier_fit(self.p2, self.c2)
        self.assertEqual(score_silv, 0.88)

    def test_inventory_weight(self):
        weight_healthy, status_healthy = compute_inventory_weight(68)
        self.assertEqual(weight_healthy, 1.0)
        self.assertEqual(status_healthy, "In Stock")

        weight_low, status_low = compute_inventory_weight(4)
        self.assertEqual(weight_low, 0.50)
        self.assertEqual(status_low, "Low Stock")

    def test_recommendation_generation(self):
        # Test generating cross-sell recommendations for SKU-501
        res = get_product_recommendations(self.db, sku="SKU-501", limit=10)
        self.assertGreaterEqual(res.total, 1)
        # Exclude base SKU from recommendations
        skus_returned = [r.sku for r in res.recommendations]
        self.assertNotIn("SKU-501", skus_returned)
        self.assertIn("SKU-902", skus_returned)

    def test_customer_specific_recommendations(self):
        res = get_product_recommendations(self.db, customer_id="CUST-001", limit=5)
        self.assertIsNotNone(res.customer)
        self.assertEqual(res.customer.name, "Apex Logistics Inc")
        self.assertGreater(len(res.recommendations), 0)

    def test_empty_results_handling(self):
        # Querying non-existent category returns empty list gracefully
        res = get_product_recommendations(self.db, category="NonExistentCategory")
        self.assertEqual(res.total, 0)
        self.assertEqual(len(res.recommendations), 0)

    def test_analytics(self):
        analytics = get_recommendation_analytics(self.db)
        self.assertGreater(analytics.potential_revenue_boost, 0)
        self.assertTrue(hasattr(analytics, "top_recommended_category"))

if __name__ == "__main__":
    unittest.main()
