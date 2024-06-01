const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Connect to MongoDB
mongoose.connect(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@mongodb-service:27017/users`);

// Define User model
const User = mongoose.model('User', new mongoose.Schema({ name: String, city: String,mobile: String, email: String, company: String,state:String,country: String}));

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

// Set the view engine to ejs
app.set('view engine', 'ejs');

// List users
app.get('/list', async (req, res) => {
   const users = await User.find();
   res.render('list', { users: users });
     
});

// Render form to create user
app.get('/create', (req, res) => {
  res.render('create');
});

// Handle form submission to create user
app.post('/create', async (req, res) => {
  const user = new User({ ...req.body });
  await user.save();
  res.redirect('/list');
});

app.get("/", (req, res) => {
    res.render('home');
});
app.get('/fibonacci/:n', (req, res) => {
    const n = parseInt(req.params.n);
    if (isNaN(n) || n <= 0) {
        res.status(400).send('Input should be a positive integer');
    } else {
        res.send(fibonacci(n).toString());
    }
});

function fibonacci(n) {
    if (n <= 2) {
        return 1;
    } else {
        let a = 1, b = 1;
        for (let i = 3; i <= n; i++) {
            const c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
}
app.listen(8080, () => {
  console.log('Server is running on port 8080');
});