const {
  model,
  Schema
} = require('mongoose')

let result = new Schema({
  Guild: String,
  Category: String
})

module.exports = model("ticketSchema", result)