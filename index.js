const express=require('express');
const cors=require('cors');
const jwt=require('jsonwebtoken');
require('dotenv').config();
const app=express();
const port=process.env.PORT || 5000;
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');

//middleware
app.use(cors());
app.use(express.json()); //eta use na krle->body theke amra j data ta pai sheta parse krte pari na

function verifyJWT(req,res,next){
    const authHeader=req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message:'unauthorized access'});
    }
    const token=authHeader.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
            return res.status(403).send({message:'FORBIDDEN ACCESS'})
        }
        console.log('decoded',decoded);
        req.decoded=decoded;
        next();
    })
    
}

//server er sathe mongodb er connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cy1j4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
     try{
         await client.connect();
         const serviceCollection=client.db('geniusCar').collection('service');
         const orderCollection=client.db('geniusCar').collection('order');

         //AUTH
        app.post('/login',async(req,res)=>{
          const user=req.body;
          const accessToken=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
              expiresIn:'1d'
          });
          res.send({accessToken});
        })

         //service api
         //db er service gula k server er sathe connect kra,home page er jnno
        app.get('/service',async(req,res)=>{
            const query={};
            const cursor=serviceCollection.find(query);
            const services=await cursor.toArray();
            res.send(services);
        })
        //akta service k server e load krte partese..like services/aktaservice,checkoutpage er jnno
        app.get('/service/:id',async(req,res)=>{
            const id=req.params.id;
            const query={_id:ObjectId(id)};
            const service=await serviceCollection.findOne(query);
            res.send(service);
        })
       //akta service post hbe ,addservice page er jnno kra hoise
        app.post('/service',async(req,res)=>{
            const newService=req.body;
            const result=await serviceCollection.insertOne(newService);
            res.send(result);
        })
        //delete krar jnno,manage services er jnno
        app.delete('/service/:id',async (req,res)=>{
            const id=req.params.id;
            const query={_id:ObjectId(id)};
            const service=await serviceCollection.deleteOne(query);
            res.send(service);
        })
        //Order collection api -create
        //orders history page er jnno data db theke nibe
        app.get('/order',verifyJWT,async(req,res)=>{
            const decodedEmail=req.decoded.email;
        const email=req.query.email;
        if(email===decodedEmail){
            const query={email:email};
            const cursor= orderCollection.find(query);
            const orders=await cursor.toArray();
            res.send(orders);
        }else{
            res.status(403).send({message:'Forbidden access'})
        }
        })
        //order insert krbe
        app.post('/order',async(req,res)=>{
            const order=req.body; //jokhn kono data ashbe api take rqst krbe
            const result=await orderCollection.insertOne(order);
            res.send(result);
        })
     }

 
     finally{
        //  await client.close();
     }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('hello world');
})

app.listen(port,()=>{
    console.log('listening to port',port);
})

