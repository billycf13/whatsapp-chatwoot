"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CwConfigController = void 0;
const cwConfig_model_1 = require("../models/cwConfig.model");
class CwConfigController {
    // Create new chatwoot config
    static createConfig(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessionId, baseUrl, agentApiToken, botApiToken, accountId, inboxIdentifier } = req.body;
                const config = new cwConfig_model_1.ChatwootConfig({
                    sessionId,
                    baseUrl,
                    agentApiToken,
                    botApiToken,
                    inboxIdentifier,
                    accountId,
                });
                const savedConfig = yield config.save();
                res.status(201).json(savedConfig);
            }
            catch (error) {
                console.error('Error creating config:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }
    // Get all configs
    static getAllConfigs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const configs = yield cwConfig_model_1.ChatwootConfig.find(); // Hapus .populate('sessionId')
                res.json(configs);
            }
            catch (error) {
                console.error('Error getting configs:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }
    // Get config by sessionId
    static getConfigBySessionId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessionId } = req.params;
                const config = yield cwConfig_model_1.ChatwootConfig.findOne({ sessionId }); // Hapus .populate('sessionId')
                if (!config) {
                    return res.status(404).json({ error: 'Config not found for this session' });
                }
                res.json(config);
            }
            catch (error) {
                console.error('Error getting config by session:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }
    // Get config by ID
    static getConfigById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const config = yield cwConfig_model_1.ChatwootConfig.findById(id).populate('sessionId');
                if (!config) {
                    return res.status(404).json({ error: 'Config not found' });
                }
                res.json(config);
            }
            catch (error) {
                console.error('Error getting config:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }
    // Update config
    static updateConfig(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { sessionId, baseUrl, agentApiToken, botApiToken, inboxIdentifier, accountId } = req.body;
                const updatedConfig = yield cwConfig_model_1.ChatwootConfig.findByIdAndUpdate(id, { sessionId, baseUrl, agentApiToken, botApiToken, inboxIdentifier, accountId }, { new: true, runValidators: true }).populate('sessionId');
                if (!updatedConfig) {
                    return res.status(404).json({ error: 'Config not found' });
                }
                res.json(updatedConfig);
            }
            catch (error) {
                console.error('Error updating config:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }
    // Delete config
    static deleteConfig(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const deletedConfig = yield cwConfig_model_1.ChatwootConfig.findByIdAndDelete(id);
                if (!deletedConfig) {
                    return res.status(404).json({ error: 'Config not found' });
                }
                res.json({ message: 'Config deleted successfully', deletedConfig });
            }
            catch (error) {
                console.error('Error deleting config:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }
    // Update config by sessionId
    static updateConfigBySessionId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessionId } = req.params;
                const { baseUrl, agentApiToken, botApiToken, inboxIdentifier } = req.body;
                const updatedConfig = yield cwConfig_model_1.ChatwootConfig.findOneAndUpdate({ sessionId }, { baseUrl, agentApiToken, botApiToken, inboxIdentifier }, { new: true, runValidators: true, upsert: true }).populate('sessionId');
                res.json(updatedConfig);
            }
            catch (error) {
                console.error('Error updating config by session:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }
}
exports.CwConfigController = CwConfigController;
