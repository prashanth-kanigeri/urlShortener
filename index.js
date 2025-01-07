require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
const dns=require('dns');


const { URL } = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}));
app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('DB Connected'))
.catch(err=>console.log(err));

const urlSchema=new mongoose.Schema({
  original_url:{type:String,required:true},
  short_url:{type:Number,required:true},
  createdAt:{type:Date,default:Date.now()}
});

const Urls=mongoose.model('Urls',urlSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

function isValidUrl(u) {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return urlRegex.test(u);
}
// Your first API endpoint
app.post('/api/shorturl', (req, res)=>{
  const { url }=req.body;
  console.log(url);
  if(!isValidUrl(url)){
return res.json({error:"Invalid url"});
  }
  
  const host=new URL(url).hostname;
  console.log(host);
  dns.lookup(host, async(err,address)=>{
    if(!address){
      console.log({error:"Invalid url"});
    }
    console.log(address);
    const result=await Urls.countDocuments({});
    const num=result+1;
    const newUrl= new Urls({
      original_url:url,
      short_url:num,
    });
    await newUrl.save();
    res.json({
      original_url:newUrl.original_url,
      short_url:newUrl.short_url,
    })
  });
});

app.get('/api/shorturl/:short_url', async(req,res)=>{
const shorturl=req.params.short_url;
console.log(shorturl);
const urlDoc= await Urls.findOne({short_url:shorturl});
console.log(urlDoc);
res.redirect(urlDoc.original_url); 
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
