import mongoose from 'mongoose';
import UserModel from '../models/user.model.js';

const updateUserRoles = async () => {
    try {
        // Conectar a MongoDB
        await mongoose.connect('mongodb://localhost:27017/ecommerce');
        console.log('Conectado a MongoDB');

        // Actualizar todos los usuarios que no tienen rol
        const result = await UserModel.updateMany(
            { role: { $exists: false } },
            { $set: { role: 'usuario' } }
        );

        console.log(`Usuarios actualizados: ${result.modifiedCount}`);
        console.log('Actualización completada');
    } catch (error) {
        console.error('Error durante la actualización:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado de MongoDB');
    }
};

updateUserRoles();
