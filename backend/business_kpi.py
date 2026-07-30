import pandas as pd
import matplotlib.pyplot as plt

# Load the original cleaned dataset
df = pd.read_csv("data/train_data.csv")
df["ship-state"] = df["ship-state"].str.upper().str.strip()

print(df.columns)

print("------ Business KPI Metrics ---")
total_revenue = df["Amount"].sum()
print("Total Revenue:", total_revenue)

total_orders = len(df)
print("Total Orders:", total_orders)

average_order_value = total_revenue / total_orders
print("Average Order Value:", average_order_value)

total_quantity = df["Qty"].sum()
print("Total Quantity Sold:", total_quantity)

category_sales = df.groupby("Category")["Qty"].sum()
print("\nQuantity Sold by Category:")
print(category_sales)
top_category = category_sales.idxmax()
print("\nTop Selling Category:", top_category)

state_revenue = df.groupby("ship-state")["Amount"].sum()
print("\nRevenue by State:")
print(state_revenue)
highest_state = state_revenue.idxmax()
print("\nHighest Revenue State:", highest_state)
highest_revenue = state_revenue.max()
print("Revenue from Highest State:", highest_revenue)

df["Date"] = pd.to_datetime(df["Date"])
df["Month"] = df["Date"].dt.month

monthly_sales = df.groupby("Month")["Amount"].sum()
print("\nMonthly Sales Trend:")
print(monthly_sales)
plt.figure(figsize=(8,5))
plt.plot(monthly_sales.index,monthly_sales.values,marker="o")
plt.title("Monthly Sales Trend")
plt.xlabel("Month")
plt.ylabel("Revenue")
plt.grid(True)
plt.show()