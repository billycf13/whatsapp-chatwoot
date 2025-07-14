CREATE MESSAGE (CLIENT API)
curl -X POST 'http://localhost:3080/chatwoot/createMessageClient' \
-H 'Content-Type: application/json' \
-d '{
    "inbox_identifier": "tz32ypVNzZpdRYmzYrYJ9SXU",
    "contact_identifier": "bd00b73b-2b8b-4ad5-98d2-8a3abe8d54ae",
    "conversation_id": 2,
    "content": "Hello from client"
}'

CREATE CONVERSATION (CLIENT API)
curl -X POST 'http://localhost:3080/chatwoot/createConversation' \
-H 'Content-Type: application/json' \
-d '{
    "inbox_identifier": "tz32ypVNzZpdRYmzYrYJ9SXU",
    "contact_identifier": "bd00b73b-2b8b-4ad5-98d2-8a3abe8d54ae"
}'
{"id":2,"uuid":"35427e8b-8107-4913-8aab-ecb3fa90c2c9","inbox_id":1,"contact_last_seen_at":0,"status":"open","agent_last_seen_at":0,"messages":[],"contact":{"id":9,"name":"Cristian Fauji Billy","email":null,"phone_number":"+6285179573501","account_id":1,"created_at":"2025-07-14T04:54:07.253Z","updated_at":"2025-07-14T04:54:07.253Z","additional_attributes":{},"identifier":"wa6285179573501","custom_attributes":{},"last_activity_at":null,"contact_type":"lead","middle_name":"","last_name":"","location":null,"country_code":null,"blocked":false,"label_list":[]}}%

CREATE CONTACT (CLIENT API)
curl -X POST 'http://localhost:3080/chatwoot/createContact' \
-H 'Content-Type: application/json' \
-d '{
    "inbox_identifier": "tz32ypVNzZpdRYmzYrYJ9SXU",
    "contact": {
        "name": "Cristian Fauji Billy",
        "phone_number": "+6285179573501",
        "identifier": "wa6285179573501"
    }
}'
{"source_id":"bd00b73b-2b8b-4ad5-98d2-8a3abe8d54ae","pubsub_token":"CbgLfZWeHuzcdM5wd7LdMpnh","id":9,"name":"Cristian Fauji Billy","email":null,"phone_number":"+6285179573501"}%

SEARCH CONTACT (APP API)
curl -X GET 'http://localhost:3080/chatwoot/searchContact/+6285179573501'
{"meta":{"count":2,"current_page":1},"payload":[{"additional_attributes":{},"availability_status":"offline","email":null,"id":9,"name":"Cristian Fauji Billy","phone_number":"+6285179573501","blocked":false,"identifier":"wa6285179573501","thumbnail":"","custom_attributes":{},"created_at":1752468847,"contact_inboxes":[{"source_id":"bd00b73b-2b8b-4ad5-98d2-8a3abe8d54ae","inbox":{"id":1,"avatar_url":"","channel_id":1,"name":"whatsapp_baileys","channel_type":"Channel::Api","provider":null}}]},{"additional_attributes":{},"availability_status":"offline","email":null,"id":2,"name":"billy cf","phone_number":"+6285817135288","blocked":false,"identifier":"6285817135288@s.whatsapp.net","thumbnail":"","custom_attributes":{},"created_at":1752133680,"contact_inboxes":[{"source_id":"ff519500-e5c2-4731-aa48-29d4ded08996","inbox":{"id":1,"avatar_url":"","channel_id":1,"name":"whatsapp_baileys","channel_type":"Channel::Api","provider":null}}]}]}%  

CREATE MESSAGE (APP API)
curl -X POST 'http://localhost:3080/chatwoot/createMessageAgent' \
-H 'Content-Type: application/json' \
-d '{
    "conversationId": 2,
    "content": "Hello from agent1",
    "messageType": "outgoing"
}'
{"id":28,"content":"Hello from agent1","inbox_id":1,"conversation_id":2,"message_type":1,"content_type":"text","status":"sent","content_attributes":{},"created_at":1752476312,"private":false,"source_id":null,"sender":{"id":1,"name":"billy","available_name":"billy","avatar_url":"","type":"user","availability_status":"online","thumbnail":""}}%