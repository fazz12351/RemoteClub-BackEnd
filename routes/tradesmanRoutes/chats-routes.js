const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const {
    verifyToken
} = require("../../Functions/middleware/authorisation");

const {
    BookingModel,
    EmployeeModel,
    CustomerModel
} = require("../../Functions/databaseSchema");
const sendMessage = require("../../Functions/Twilio");
const { s3Retrieve } = require("../../Functions/general_functions");
const { dynamodb } = require("../../Functions/configuration");
const { v4: uuidv4 } = require('uuid'); // Import UUID library for generating unique IDs



app.post("/:userId", verifyToken, async (req, res) => {
    try {
        const currentUser = req.user.id;
        const userID = req.params.userId;
        const chatID = `${currentUser}:${userID}`;
        const message = req.body.message;

        if (!message) {
            return res.status(204).json({ "Error": "No message attached in body" });
        }

        // Verify user exists in either EmployeeModel or CustomerModel
        const exist = await EmployeeModel.findOne({ _id: userID }) || await CustomerModel.findOne({ _id: userID });
        if (!exist) {
            return res.status(200).json({
                response: "No matching users"
            });
        }

        // Retrieve the chat
        const getChatQuery = {
            TableName: "Chats",
            Key: {
                ChatId: chatID
            }
        };

        const hasChat = await dynamodb.get(getChatQuery).promise();

        if (hasChat.Item) {
            // Chat exists; add the new message to the conversation
            const newMessageId = uuidv4();
            const newMessage = {
                [newMessageId]: {
                    userId: currentUser,
                    message: message,
                    createdAt: new Date().toISOString()
                }
            };

            const updateChatParams = {
                TableName: "Chats",
                Key: { ChatId: chatID },
                UpdateExpression: "SET conversation.#newMessageId = :newMessage",
                ExpressionAttributeNames: {
                    "#newMessageId": newMessageId
                },
                ExpressionAttributeValues: {
                    ":newMessage": newMessage[newMessageId]
                },
                ReturnValues: "ALL_NEW"
            };

            await dynamodb.update(updateChatParams).promise();
            return res.status(200).json({ response: "Message added to existing chat", newMessageId });
        } else {
            // Chat doesn't exist; create a new chat with the first message
            const messageId = uuidv4();
            const putNewChatParams = {
                TableName: 'Chats',
                Item: {
                    ChatId: chatID,
                    conversation: {
                        [messageId]: {
                            userId: currentUser,
                            message: message,
                            createdAt: new Date().toISOString()
                        }
                    }
                }
            };

            await dynamodb.put(putNewChatParams).promise();
            return res.status(200).json({ response: "First message sent", messageId });
        }
    } catch (err) {
        return res.status(400).json({ Error: err.message });
    }
});


app.get("/:userId", verifyToken, async (req, res) => {
    try {
        const currentUser = req.user.id;
        const userId = req.params.userId;
        const chatID = `${currentUser}:${userId}`;

        const getChatQuery = {
            TableName: "Chats",
            Key: { ChatId: chatID }
        };

        const response = await dynamodb.get(getChatQuery).promise();

        if (!response.Item) {
            return res.status(204).json({ message: "No chats" });
        }

        return res.status(200).json(response.Item.conversation);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});



module.exports = app