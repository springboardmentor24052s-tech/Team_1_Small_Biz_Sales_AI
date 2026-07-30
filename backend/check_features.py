import pandas as pd

df = pd.read_csv("data/train_data_processed.csv")
X = df.drop("Amount", axis=1)
print(X.columns.tolist())
print()
print("Total Features:", len(X.columns))