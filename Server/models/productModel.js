const mongoose = require("mongoose");
mongoose.set('strictQuery', true);

const productSchema = mongoose.Schema ({
    Temperature: String,
    Humidity: String,
    Visible_IR: String,
    Infrared: String,
    Illuminance: String,
    //categories: [String],
    Weather: String,
    Out_Temp: String,
    Out_Humi: String,
    Out_Visible: String,
    Out_WindSpeed: String,
    Location: String,
    //name: {type: String, required: true },
    //categories: [String],
    modifiedDate: {type:Date, default: Date.now }
});

module.exports = mongoose.model("Monitor", productSchema);
