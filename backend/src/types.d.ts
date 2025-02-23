import Mongoose from 'mongoose';
import { OperationType } from './constants/operations';

export interface identified {
    _id?: string | Mongoose.Types.ObjectId,
    createdAt: Date,
    updatedAt: Date
}

export interface Document extends Identified {
    name: string
}

export interface Operation extends Identified {
    documentId: string | Mongoose.Types.ObjectId,
    type: OperationType,
    cause?: string | Mongoose.Types.ObjectId
    index: number // gonna be using decimals for the unique index
    character?: string //we only need the character if there are many  
}
