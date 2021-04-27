'use strict';


//////////////////////////
///// DEPENDENCIES///////
////////////////////////

require('dotenv').config();

const express= require('express');

const cors= require('cors');

const superagent= require('superagent');

const pg = require('pg');

const methodOverride= require('method-override');


//////////////////////////
///// APP SETUP   ///////
////////////////////////

const PORT=process.env.PORT||3000;

const app=express();

app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });


//////////////////////////
///// TEMPLATING  ///////
////////////////////////

app.use(express.static('./public'));

app.set('view engine', 'ejs');


//////////////////////////
///// ROUTES      ///////
////////////////////////

app.get('/',homeHandler);

app.get('/search', searchHandler);

app.get('/all',allHandler);

app.post('/saveData', insertHandler);
app.get('/saveData',renderSavedData);
app.get('/alreadyAdded',alreadyAddedHandler);

app.get('/details/:id', renderDetailHandler);
app.put('/details/:id', updateHandler);
app.delete('/details/:id', deleteHandler);






//////////////////////////
///// HANDLERS    ///////
////////////////////////

function homeHandler(req,res){
    res.render('pages/index')
}

function searchHandler(req,res){
    const from=req.query.from;
    const to= req.query.to;
    const url=`http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline&price_greater_than=${from}&price_less_than=${to}`;

    superagent.get(url).then(data=>{
        const dataBody=data.body;
        const correctData=dataBody.map(e=>{
            return new Makeup(e);
        });
        res.render('pages/search',{data:correctData})
    });
}

function allHandler(req,res){
    let url= 'http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline';

    superagent.get(url).then(data=>{
        const dataBody=data.body;
        const correctData= dataBody.map(e=>{
            return new Makeup(e)
        });
        res.render('pages/all',{data:correctData})
    })
}


function insertHandler (req,res){
    const {name, price, image, description}=req.body;
    const safeValues=[name, price, image, description]
    const SQL=`INSERT INTO table1 (name, price, image, description) VALUES ($1,$2,$3,$4);`;

    const sqlSearch=`SELECT * FROM table1 WHERE name='${name}';`;

    client.query(sqlSearch).then(searchedData=>{
        if(searchedData.rows.length===0){
            client.query(SQL,safeValues).then(()=>{
                res.redirect('/saveData')
            })
        } else if (searchedData.rows[0].name===name){
            res.redirect('/alreadyAdded')
        }
    })
}

function renderSavedData(req,res){
    const SQL='SELECT * FROM table1;';

    client.query(SQL).then(data=>{
        res.render('pages/cart', {data:data.rows, count:data.rows.length});
    })
}

function alreadyAddedHandler(req,res){
    res.render('pages/alreadyAdded')
}


function renderDetailHandler(req,res){
    const id= req.params.id;
    const SQL= `SELECT * FROM table1 WHERE id=$1;`;
    const safeValues=[id];

    client.query(SQL,safeValues).then(data=>{
        res.render('pages/details', {data:data.rows[0]});
    });
}

function updateHandler(req,res){
    const id= req.params.id;
    const {name, price, image, description}=req.body;
    const safeValues=[name, price, image, description,id];
    const SQL= `UPDATE table1 SET name=$1, price=$2, image=$3, description=$4 WHERE id=$5;`;

    client.query(SQL,safeValues).then(()=>{
        res.redirect(`/details/${id}`);
    });

    
}

function deleteHandler(req,res){
    const id=req.params.id;
    const SQL=`DELETE FROM table1 WHERE id=$1;`;
    const safeValues=[id];

    client.query(SQL,safeValues).then(()=>{
        res.redirect('/saveData')
    })
}




//////////////////////////
///// CONSTRUCTOR  //////
////////////////////////

// name, price, image, and description

function Makeup(data){
    this.name=data.name;
    this.price=data.price;
    this.image=data.image_link;
    this.description=data.description;
}

//////////////////////////
///// lISTENING   ///////
////////////////////////

client.connect().then(()=>{
    app.listen(PORT,()=>{
        console.log(`listening on: ${PORT}`)
    })
})



