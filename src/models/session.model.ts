import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    phoneNumber: {
        type: String,
        sparse: true,
        index: true
    },
    name: String,
}, {
    timestamps: true
})

sessionSchema.pre('save', function(next) {
    if (!this.isNew && this.isModified('sessionId')) {
        next(new Error('sessionId cannot be modified'))
    }
    next()
})

export const Session = mongoose.model('Session', sessionSchema)