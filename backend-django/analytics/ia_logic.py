import numpy as np
from sklearn.linear_model import LinearRegression

# Imagina que entrenamos el modelo con datos de camiones reales
# X = [[velocidad, carga_kg]] -> y = consumo_litros_por_km
X = np.array([[20, 1000], [40, 1000], [60, 1000], [80, 1000], [40, 5000]])
y = np.array([0.5, 0.3, 0.25, 0.4, 0.6]) # El consumo sube si vas muy lento o muy rápido

modelo_combustible = LinearRegression().fit(X, y)

def predecir_gasto(velocidad, carga=1000):
    consumo = modelo_combustible.predict([[velocidad, carga]])
    return round(float(consumo[0]), 4)