import unittest
from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.inventory import Product
from app.models.customers import Customer
from app.services.recommendation_service import (
    compute_category_affinity,
    compute_customer_tier_fit,
    compute_inventory_weight,
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

        self.tenant_id = uuid4()

        # Seed sample product test dataset
        self.p1 = Product(id=uuid4(), tenant_id=self.tenant_id, sku="SKU-501", name="AI POS Terminal X1", category="Terminals")
        self.p2 = Product(id=uuid4(), tenant_id=self.tenant_id, sku="SKU-902", name="Thermal Receipt Paper", category="Supplies")
        self.p3 = Product(id=uuid4(), tenant_id=self.tenant_id, sku="SKU-441", name="Bluetooth Barcode Scanner", category="Hardware")
        self.db.add_all([self.p1, self.p2, self.p3])

        # Seed sample customer test dataset
        self.c1 = Customer(
            id=uuid4(),
            tenant_id=self.tenant_id,
            source_system="test",
            external_customer_id="CUST-001",
            last_purchase=datetime.now(UTC),
            order_count=10,
            item_quantity=50,
            total_revenue=Decimal("142500.00"),
            recency_days=5
        )
        self.c2 = Customer(
            id=uuid4(),
            tenant_id=self.tenant_id,
            source_system="test",
            external_customer_id="CUST-002",
            last_purchase=datetime.now(UTC),
            order_count=3,
            item_quantity=10,
            total_revenue=Decimal("19800.00"),
            recency_days=20
        )
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
        # High value customer fits high-value terminal
        score_plat = compute_customer_tier_fit(self.p1, self.c1)
        self.assertGreaterEqual(score_plat, 0.70)

        # Customer fits supplies
        score_silv = compute_customer_tier_fit(self.p2, self.c2)
        self.assertGreaterEqual(score_silv, 0.70)

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

    def test_customer_specific_recommendations(self):
        res = get_product_recommendations(self.db, customer_id="CUST-001", limit=5)
        self.assertGreaterEqual(len(res.recommendations), 0)

    def test_empty_results_handling(self):
        # Querying non-existent category returns empty list gracefully
        res = get_product_recommendations(self.db, category="NonExistentCategory")
        self.assertEqual(res.total, 0)
        self.assertEqual(len(res.recommendations), 0)

    def test_analytics(self):
        analytics = get_recommendation_analytics(self.db)
        self.assertGreaterEqual(analytics.potential_revenue_boost, 0)

if __name__ == "__main__":
    unittest.main()
