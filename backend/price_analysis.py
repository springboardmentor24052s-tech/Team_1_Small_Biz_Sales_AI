import pandas as pd

price_df = pd.read_csv("data/price_dataset.csv")

print("Price Dataset Loaded Successfully!")
print("Shape:", price_df.shape)
print(price_df.head())