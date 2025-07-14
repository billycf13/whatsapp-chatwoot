import mongoose from 'mongoose'
import { ref } from 'process'

const ContactSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        ref: 'Session',
        index: true
    },
    identifier: {
        type: String,
        required: true,
    },
    phone_number : {
        type: String,
        required: true,
        validate: {
            validator: function (v: string) {
                return /^\[0-9]\d{1,14}$/.test(v)
            },
            message: (props: { value: any }) => `${props.value} is not a valid phone number!}`
        }
    },
    name: String,
    source_id: String,
    conversation_id: Number,
}, {
    timestamps: true
})

ContactSchema.index({ sessionId: 1, identifier: 1 }, { unique: true })

export const Contact = mongoose.model('Contact', ContactSchema)