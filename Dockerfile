# Usa una imagen ligera de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia todo el código fuente
COPY . .

# Compila TypeScript a JavaScript
RUN npm run build

# Expone el puerto en el que se ejecutará la aplicación
EXPOSE 5000

# Ejecuta el servidor con los archivos compilados
CMD ["npm", "start"]
