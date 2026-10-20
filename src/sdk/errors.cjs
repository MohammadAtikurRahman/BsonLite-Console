'use strict';
class BsonLiteError extends Error { constructor(code,message,cause){super(message,{cause});this.name='BsonLiteError';this.code=code;} }
module.exports={BsonLiteError};
