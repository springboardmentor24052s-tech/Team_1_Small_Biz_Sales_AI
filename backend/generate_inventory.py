import pandas as pd
import numpy as np

# Load cleaned sales dataset
df = pd.read_csv("data/cleaned_sales_report.csv")

# Group by product (SKU)
inventory = (
    df.groupby(["SKU", "Category", "Style", "Size"])
      .agg(
          Total_Quantity_Sold=("Qty", "sum"),
          Total_Sales=("Amount", "sum"),
          Average_Price=("Amount", "mean"),
          Total_Orders=("Order ID", "count")
      )
      .reset_index()
)

# Generate estimated stock values
inventory["Initial_Stock"] = np.random.randint(100, 501, len(inventory))

inventory["Current_Stock"] = (
    inventory["Initial_Stock"] - inventory["Total_Quantity_Sold"]
).clip(lower=0)

inventory["Reorder_Level"] = 50

inventory["Inventory_Status"] = inventory["Current_Stock"].apply(
    lambda x: "Low Stock" if x <= 50 else "In Stock"
)

# Save dataset
inventory.to_csv("inventory_dataset.csv", index=False)

print("Inventory dataset created successfully!")
print(inventory.head())
print("\nShape:", inventory.shape)