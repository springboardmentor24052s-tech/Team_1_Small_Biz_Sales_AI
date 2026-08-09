import unittest

import pandas as pd

from preprocessing.customer_segmentation import (
    MODEL_VERSION,
    build_customer_features,
    train_customer_segmentation,
)


class CustomerSegmentationTests(unittest.TestCase):
    def test_customer_features_keep_returns_separate_from_sales(self):
        frame = pd.DataFrame(
            [
                {
                    "invoice_id": "100",
                    "stock_code": "A",
                    "quantity": 2,
                    "invoice_date": "2011-01-01",
                    "unit_price": 10,
                    "customer_id": "C-1",
                    "country": "India",
                    "transaction_type": "sale",
                    "line_revenue": 20,
                },
                {
                    "invoice_id": "101",
                    "stock_code": "B",
                    "quantity": 1,
                    "invoice_date": "2011-02-01",
                    "unit_price": 30,
                    "customer_id": "C-1",
                    "country": "India",
                    "transaction_type": "sale",
                    "line_revenue": 30,
                },
                {
                    "invoice_id": "C102",
                    "stock_code": "A",
                    "quantity": -1,
                    "invoice_date": "2011-02-02",
                    "unit_price": 10,
                    "customer_id": "C-1",
                    "country": "India",
                    "transaction_type": "return",
                    "line_revenue": -10,
                },
            ]
        )

        features = build_customer_features(frame)

        self.assertEqual(len(features), 1)
        self.assertEqual(features.loc[0, "order_count"], 2)
        self.assertEqual(features.loc[0, "total_revenue"], 50)
        self.assertEqual(features.loc[0, "return_order_count"], 1)
        self.assertAlmostEqual(features.loc[0, "return_rate"], 1 / 3, places=4)
        self.assertGreaterEqual(features.loc[0, "engagement_score"], 0)
        self.assertLessEqual(features.loc[0, "engagement_score"], 100)

    def test_models_are_evaluated_and_assign_every_customer(self):
        features = pd.DataFrame(
            [
                {
                    "customer_id": f"C-{index}",
                    "recency_days": 2 + index * 8,
                    "order_count": 30 - index,
                    "total_revenue": 5000 - index * 240,
                    "active_months": max(1, 12 - index // 2),
                    "product_variety": 60 - index * 3,
                    "return_rate": min(0.5, index * 0.03),
                    "engagement_score": 95 - index * 5,
                }
                for index in range(12)
            ]
        )

        result = train_customer_segmentation(features, min_clusters=2, max_clusters=4)

        self.assertEqual(len(result.assignments), 12)
        self.assertFalse(result.assignments["segment_name"].isna().any())
        self.assertTrue((result.assignments["model_version"] == MODEL_VERSION).all())
        algorithms = {item["algorithm"] for item in result.report["candidate_metrics"]}
        self.assertEqual(algorithms, {"kmeans", "hierarchical"})
        self.assertGreater(result.report["selected_metrics"]["silhouette_score"], -1)


if __name__ == "__main__":
    unittest.main()
