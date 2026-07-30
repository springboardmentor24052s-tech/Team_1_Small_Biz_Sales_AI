import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (mean_absolute_error,mean_squared_error,r2_score)
import joblib

# Load the processed dataset
train_df = pd.read_csv("data/train_data_processed.csv")

# Features (input)
X = train_df.drop(columns=["Amount"])

# Target (output)
y = train_df["Amount"]

print("Features Shape:", X.shape)
print("Target Shape:", y.shape)

print("\nFirst 5 Feature Rows:")
print(X.head())

print("\nFirst 5 Target Values:")
print(y.head())

# Create the model
model = RandomForestRegressor(n_estimators=100,random_state=42)
model.fit(X, y)

print("\nModel Training Completed!")

# Load processed test dataset
test_df = pd.read_csv("data/test_data_processed.csv")

# Separate features and target
X_test = test_df.drop(columns=["Amount"])
y_test = test_df["Amount"]

print("\nTest Features Shape:", X_test.shape)
print("Test Target Shape:", y_test.shape)

# Predict on test dataset
y_pred = model.predict(X_test)

print("\nFirst 10 Predictions:")
print(y_pred[:10])

# Evaluation Metrics
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("\nModel Performance")
print("----------------------------")
print("MAE :", mae)
print("RMSE:", rmse)
print("R2 Score:", r2)

# Save the trained model
joblib.dump(model, "sales_model.pkl")

print("Model saved successfully!")
