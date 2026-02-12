import { Schema } from 'mongoose';
import mongoose from 'mongoose';

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        sparse: true,
        unique: true
    },
    password: {
        type: String,
        required: function () {
            return this.authMethod === 'local';
        }
    },
    token: {
        type: String
    },
    googleId: {
        type: String,
        sparse: true
    },
    authMethod: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    }
});

const User = new mongoose.model("User", userSchema);
export { User };