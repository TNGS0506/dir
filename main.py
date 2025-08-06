import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime


data = []
fixed_month = 5 

with open("./datas/6_11_data.csv", "r") as f:
    for line in f:
        value_str, date_str = line.strip().split()
        value = float(value_str)
        day, hour, minute, second = map(int, date_str.split(":"))
        dt = datetime(year=2025, month=fixed_month, day=day, hour=hour, minute=minute, second=second)
        data.append((dt, value))

df = pd.DataFrame(data, columns=["timestamp", "value"])

plt.figure(figsize=(28, 8))
plt.plot(df["timestamp"], df["value"], marker="o")
plt.title("Value Over Time")
plt.xlabel("Timestamp")
plt.ylabel("Value")
plt.grid(True)
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
