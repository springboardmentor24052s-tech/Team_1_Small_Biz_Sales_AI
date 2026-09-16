import unittest

import pandas as pd

from preprocessing.milestone1 import (
    clean_customer_transactions,
    clean_inventory,
    clean_sales,
)


class MilestoneOnePreprocessingTests(unittest.TestCase):
    def test_sales_keeps_cancellations_but_labels_them(self):
        frame = pd.DataFrame(
            [
                {
                    "Order ID": "ORDER-1",
                    "Date": "04-30-22",
                    "Status": "Cancelled",
                    "Fulfilment": "Merchant",
                    "Sales Channel ": "Amazon.in",
                    "ship-service-level": "Standard",
                    "Style": "STYLE-1",
                    "SKU": "sku-1",
                    "Category": "kurta",
                    "Size": "M",
                    "ASIN": "ASIN-1",
                    "Courier Status": None,
                    "Qty": 0,
                    "currency": None,
                    "Amount": None,
                    "ship-state": "Maharashtra",
                    "B2B": False,
                    "fulfilled-by": "Easy Ship",
                }
            ]
        )

        cleaned, report = clean_sales(frame)

        self.assertEqual(cleaned.loc[0, "transaction_type"], "cancelled")
        self.assertEqual(cleaned.loc[0, "currency"], "INR")
        self.assertEqual(report["missing_amount_rows"], 1)
        self.assertEqual(report["non_positive_quantity_rows"], 1)

    def test_inventory_uses_real_stock_and_marks_reorder_status(self):
        frame = pd.DataFrame(
            [
                {
                    "SKU Code": "SKU-1",
                    "Design No.": "D1",
                    "Stock": 3,
                    "Category": "AN : LEGGINGS",
                    "Size": "M",
                    "Color": "Red",
                }
            ]
        )

        cleaned, report = clean_inventory(frame)

        self.assertEqual(cleaned.loc[0, "stock_quantity"], 3)
        self.assertEqual(cleaned.loc[0, "stock_status"], "low_stock")
        self.assertEqual(report["low_stock_skus"], 1)

    def test_customer_returns_are_separate_from_sales(self):
        frame = pd.DataFrame(
            [
                {
                    "Invoice": "100",
                    "StockCode": "A",
                    "Description": "Item A",
                    "Quantity": 2,
                    "InvoiceDate": "2010-01-01",
                    "Price": 5,
                    "Customer ID": 10,
                    "Country": "United Kingdom",
                },
                {
                    "Invoice": "C101",
                    "StockCode": "A",
                    "Description": "Item A",
                    "Quantity": -1,
                    "InvoiceDate": "2010-01-02",
                    "Price": 5,
                    "Customer ID": 10,
                    "Country": "United Kingdom",
                },
            ]
        )

        cleaned, summary, report = clean_customer_transactions(frame)

        self.assertEqual(cleaned["transaction_type"].tolist(), ["sale", "return"])
        self.assertEqual(summary.loc[0, "total_revenue"], 10)
        self.assertEqual(report["return_rows"], 1)


if __name__ == "__main__":
    unittest.main()
