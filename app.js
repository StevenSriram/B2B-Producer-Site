const express = require('express');
const hbs = require('hbs');
const mysql = require('mysql2')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs')
const multer = require('multer');

const app = express();

dotenv.config({
    path : './.env'
})

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
})
db.connect((err) =>{
    if(err)
        console.log(err)
    else  
        console.log('MYSQL - - Connected')
})


// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/products/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Set Handlebars as the view engine
app.set('view engine', 'hbs');
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Render the index page
app.get('/', (req, res) => {
    res.render('home');
});

let products = []
db.query('SELECT P_Id,P_Name, P_Price, Image_Path FROM products', (err, rows) => {
    if (err) throw err;
    products = rows;
    console.log(products);
  });

app.get('/index',(req,res) =>{
    res.render('index',{products})
})

// Render the add form
app.get('/add', (req, res) => {
    res.render('add');
});

let amt = 0
app.get('/cart/:id', (req, res) => {
    const productId = req.params.id;
    product = products.find(p => p.P_Id == productId);
    if (!product) {
        res.status(404).send('Product not found');
    } else {
        amt = Number(product.P_Price)
        console.log(amt)
        res.render('cart', { product ,user });
    }
});

app.get('/my-product',(req,res)=>{
    db.query('SELECT P_Id,P_Name, P_Price, Image_Path FROM products where Uploader = ?',
    [user.Name],
    (err,rows)=>{
        if(err) throw err;
        const myProducts = rows
        console.log(myProducts)
        res.render('add',{myProducts})
    })
})

app.get('/login',(req,res)=>{
    res.render('index',{user, products})
})

app.get('/logout', (req, res) => {
    console.log('Logging out');
    res.redirect('/index');
});

/*
    Render - sends the HTML as the response to the client's request.
    ( to give something to someone )
    
    Redirect - sends a redirect response to the client's browser
*/


app.post('/register',upload.none(),async (req,res)=>{
    const { register_name, register_email, register_password } = req.body
    const hash_pass = await bcrypt.hash(register_password,10)
    console.log(register_name, register_email, hash_pass)

    db.query('INSERT INTO Registration(Name,Email,Password) VALUES (?,?,?)',
    [register_name,register_email,hash_pass],
    (err,result) =>{
        if(err)
            console.log("Error Occured : " + err.message)
        else{
            console.log("User registered successfully")
            res.redirect('/index')
        }
        }
    );
})

let user = ''   // Login Details

app.post('/login',upload.none(),async (req,res)=>{
    const {login_email,login_password} = req.body
    console.log(login_email,login_password)

    db.query(
        'SELECT * FROM Registration WHERE Email = ?',
        [login_email],
        async (err, result) => {
            if (err)
                console.log("Error retrieving user: " + err.message);

            if (result.length === 0) {
                console.log("User not found");
                res.render('index', {errorMessage: 'User not found.', products});
            } 
            else {
                user = result[0];
                const passwordMatch = await bcrypt.compare(login_password, user.Password);

                if (passwordMatch) {
                    console.log("Login successful");
                    res.render('index', {user, products});
                } else {
                    console.log("Incorrect password");
                    res.render('index', {errorMessage: 'Incorrect password.', products});
                }
            }
        }
    );

})

// Handle form submission
app.post('/product', upload.single('photo'), (req, res) => {
    const { name, price } = req.body;
    const filePath = req.file.path.replace('public', '');
    console.log(name, price, filePath);

    db.query(
        'SELECT Image_Path FROM Products WHERE Image_Path = ?',
        [filePath],
        (err,result) =>{
            if(err)
                console.log("Error Occured : " + err.message)

            if(result.length > 0){
                res.render('add',{ name, price, filePath });
            }
            else{
                db.query(
                    'INSERT INTO Products(P_Name,P_Price,Image_Path,Uploader) VALUES (?,?,?,?)',
                    [name,price,filePath,user.Name],
                    (err,result) =>{
                        if(err)
                            console.log("Error Occured : " + err.message)        
                        else{
                            console.log("Data Inserted Successfully")

                            db.query('SELECT P_Id,P_Name, P_Price, Image_Path FROM products', (err, rows) => {
                                if (err) throw err;
                                products = rows;
                                console.log(products);
                              });

                            res.redirect('/login')
                        }     
                    }
                );
            }

        }
    );

});

const Razorpay = require('razorpay');
let instance = new Razorpay({
    key_id: 'rzp_test_w6Pb7Tw8dykzyp',
    key_secret: '4a8tzis4N1L7mmgvedMGD7Al',
  });

app.post('/order',(req,res)=>{
    let options = {
        amount: amt * 100,
        currency: "INR",
    }
    instance.orders.create(options,(err,order)=>{
        console.log(order)
        res.json(order)
    })
})



app.listen(process.env.PORT, () => {
    console.log(`Server running on port localhost:${process.env.PORT}`);
});












/* Razor Pay 
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_YrLqd1cFuvg0Jm',
    key_secret: 'ejJti5LTPXK7LJzvkiHZcX5I'
  });

  app.post('/create/orderId', (req, res) => {
    console.log(`Create OrderId request ${req.body}`)

    var options = {
        amount: req.body.amount,
        currency: "INR",
        receipt: "rcp1"
      };
      instance.orders.create(options, function(err, order) {
        console.log(order);
        res.send({orderId : order.id})
      });
    
});

    app.post("/api/payment/verify", (req, res)=>{

        let body=req.body.response.razorpay_order_id + "/" + req.body.response.razorpay_payment_id;
        var crypto = require("crypto");
        var expectedSignature = crypto.createHmac('sha256', 'Wok5mJv2F0pa5HKLeXZfUr9r')
        .update(body.toString('ejJti5LTPXK7LJzvkiHZcX5I'))
        .digest('hex');
        console.log("sig received", req.body.response.razorpay_signature);
        console.log("sig generated", expectedSignature);
        var response = {"signatureIsValid":"false"}
        if(expectedSignature === req.body.response.razorpay_signature)
        response={"signatureIsValid":"true"}
        res.send(response);
        });

//End */