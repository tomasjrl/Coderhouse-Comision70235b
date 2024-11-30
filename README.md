# E-commerce Project

Proyecto de e-commerce desarrollado con Node.js, Express y MongoDB.

## Ejecutar el Proyecto

1. Iniciar el servidor:
```bash
npm start
```

2. Acceder a la aplicación:
   - Abrir el navegador en `http://localhost:8080`

- **Autenticación**: 
  - Roles de usuario (admin/usuario)

## Credenciales de Prueba

### Admin
- Email: [configurado en .env]
- Password: [configurado en .env]

## Estructura del Proyecto

```
src/
├── config/         # Configuración de la aplicación
├── models/         # Modelos de MongoDB
├── routes/         # Rutas de la aplicación
├── views/          # Plantillas Handlebars
├── public/         # Archivos estáticos
└── scripts/        # Scripts de utilidad
```

## Tecnologías Utilizadas

- Backend: Node.js, Express
- Base de datos: MongoDB
- Autenticación: Passport.js
- Frontend: Handlebars, Bootstrap
- Estado: Express-session

## Notas Adicionales

- La aplicación utiliza MongoDB Atlas como base de datos
- Las contraseñas se almacenan hasheadas usando bcrypt
- La interfaz es responsive y soporta tema claro/oscuro

## Contacto

- Tomás Stabilini
- CoderHouse Comisión 70235
