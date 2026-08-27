const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    event_name: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true
    },
     venue: {
      type: String,
      required: true
    },
    organizer: {
      type: String,
      required: true
    },
      participants: [
    {
      name: String,
      dept: String,
      branch: String,
      curr_year: String
    }
  ]
  },
  {
    collection: "allevent"
  }
);
const Event = mongoose.model("Event", eventSchema);
module.exports = Event;