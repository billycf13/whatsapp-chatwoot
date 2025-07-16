import { Request, Response } from 'express'
import { ChatwootConfig } from '../models/cwConfig.model'

export class CwConfigController {
    // Create new chatwoot config
    static async createConfig(req: Request, res: Response) {
        try {
            const { sessionId, baseUrl, agentApiToken, botApiToken, inboxIdentifier, accountId } = req.body
            
            const config = new ChatwootConfig({
                sessionId,
                baseUrl,
                agentApiToken,
                botApiToken,
                inboxIdentifier,
                accountId,
            })
            
            const savedConfig = await config.save()
            res.status(201).json(savedConfig)
        } catch (error: any) {
            console.error('Error creating config:', error)
            res.status(500).json({ error: error.message })
        }
    }

    // Get all configs
    static async getAllConfigs(req: Request, res: Response) {
        try {
            const configs = await ChatwootConfig.find().populate('sessionId')
            res.json(configs)
        } catch (error: any) {
            console.error('Error getting configs:', error)
            res.status(500).json({ error: error.message })
        }
    }

    // Get config by ID
    static async getConfigById(req: Request, res: Response) {
        try {
            const { id } = req.params
            const config = await ChatwootConfig.findById(id).populate('sessionId')
            
            if (!config) {
                return res.status(404).json({ error: 'Config not found' })
            }
            
            res.json(config)
        } catch (error: any) {
            console.error('Error getting config:', error)
            res.status(500).json({ error: error.message })
        }
    }

    // Get config by sessionId
    static async getConfigBySessionId(req: Request, res: Response) {
        try {
            const { sessionId } = req.params
            const config = await ChatwootConfig.findOne({ sessionId }).populate('sessionId')
            
            if (!config) {
                return res.status(404).json({ error: 'Config not found for this session' })
            }
            
            res.json(config)
        } catch (error: any) {
            console.error('Error getting config by session:', error)
            res.status(500).json({ error: error.message })
        }
    }

    // Update config
    static async updateConfig(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { sessionId, baseUrl, agentApiToken, botApiToken, inboxIdentifier, accountId } = req.body
            
            const updatedConfig = await ChatwootConfig.findByIdAndUpdate(
                id,
                { sessionId, baseUrl, agentApiToken, botApiToken, inboxIdentifier, accountId },
                { new: true, runValidators: true }
            ).populate('sessionId')
            
            if (!updatedConfig) {
                return res.status(404).json({ error: 'Config not found' })
            }
            
            res.json(updatedConfig)
        } catch (error: any) {
            console.error('Error updating config:', error)
            res.status(500).json({ error: error.message })
        }
    }

    // Delete config
    static async deleteConfig(req: Request, res: Response) {
        try {
            const { id } = req.params
            const deletedConfig = await ChatwootConfig.findByIdAndDelete(id)
            
            if (!deletedConfig) {
                return res.status(404).json({ error: 'Config not found' })
            }
            
            res.json({ message: 'Config deleted successfully', deletedConfig })
        } catch (error: any) {
            console.error('Error deleting config:', error)
            res.status(500).json({ error: error.message })
        }
    }

    // Update config by sessionId
    static async updateConfigBySessionId(req: Request, res: Response) {
        try {
            const { sessionId } = req.params
            const { baseUrl, agentApiToken, botApiToken, inboxIdentifier } = req.body
            
            const updatedConfig = await ChatwootConfig.findOneAndUpdate(
                { sessionId },
                { baseUrl, agentApiToken, botApiToken, inboxIdentifier },
                { new: true, runValidators: true, upsert: true }
            ).populate('sessionId')
            
            res.json(updatedConfig)
        } catch (error: any) {
            console.error('Error updating config by session:', error)
            res.status(500).json({ error: error.message })
        }
    }
}