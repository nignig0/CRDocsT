import { model, Schema } from "mongoose";
import { Document } from '../types'

const DocumentSchema = new Schema<Document>({

    name: {
        type: String, 
        required: true
    }

}, {
    timestamps: true
});

export const DocumentModel = model<Document>('document', DocumentSchema);
