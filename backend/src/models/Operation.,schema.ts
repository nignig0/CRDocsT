import { model, Schema } from "mongoose";
import { Operation } from "../types";
import { OperationType } from "../constants/operations";

const OperationSchema = new Schema<Operation>({
    documentId: {
        type: Schema.Types.ObjectId, 
        ref: 'document',
        required: true
    },
    
    type: {
        type: String, 
        required: true,
        enum: OperationType
    },

    cause: {
        type: Schema.Types.ObjectId,
        ref: 'operation',
        required: false
    },

    uid: {
        type: String,
        required: true
    },
    
    character: {
        type: String, 
        required: false
    }

}, {
    timestamps: true
});

export const OperationModel = model<Operation>('operation', OperationSchema);
