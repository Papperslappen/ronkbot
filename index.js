const Discord = require('discord.js');
require('dotenv').config();
var _ = require('lodash');

const sqlite3 = require('sqlite3');
const {open} = require('sqlite');
const { result } = require('lodash');
sqlite3.verbose();

function ronkfinder(startindex,text){
    const RONK = ['r','o','n','k'];
    var result = {'endindex':startindex,'ronks':0};
    return _.reduce(text,(acc,c)=>{
        if(c==RONK[acc.endindex]){
            var i = acc.endindex+1;
            var r = acc.ronks;
                if(i>=RONK.length){
                    i = 0;
                    r += 1; 
                }
            return {'endindex':i,'ronks':r}
        }else{
            return acc
        }
    } ,result)
}

const BASE = 1;

function ronklevel(base,ronks){
    return Math.floor(-1/2-base+Math.sqrt(8*ronks+(1+2*base)*(1+2*base))/2)
}

function levelronks(base,level){
    return level*base+(level*level+level)/2.0
}

function levelup(msg,level){
    if(msg.author){
        msg.channel.send(`GG, ${msg.author} you just advanced to level ${level}`);
    }
}

const client = new Discord.Client();
(async () => {
    // open the database
    const db = await open({
      filename: './folx.db',
      driver: sqlite3.Database
    });

    db.run('CREATE TABLE IF NOT EXISTS folx (server NUM,user NUM,score NUM,endindex NUM);')

    client.once('ready', async () => {
        console.log('Ready!');
    });
    
    client.on('message', async (msg) => {
        if(msg.author===undefined || msg.channel.guild===undefined){
            return
        }
        var usr = await db.get('SELECT * FROM folx WHERE server=? AND user=?;',[
            msg.channel.guild.id,
            msg.author.id,
        ]).catch(console.err);
        console.log(usr);
        var ronks = 0;
        var endindex = 0;
        if(usr){
            ronks = usr.score;
            endindex = usr.endindex;
        }
        
        var result = ronkfinder(endindex,msg.content);
        console.log(result);
        var oldronks;
        if(usr){
            oldronks = usr.score;
            await db.run('UPDATE folx SET score = ?, endindex = ? WHERE server = ? AND user=?',[
                result.ronks+usr.score,
                result.endindex,
                msg.channel.guild.id,
                msg.author.id,
            ]);
        }else{
            oldronks = 0;
            await db.run('INSERT INTO folx (server,user,score,endindex) VALUES (?,?,?,?);',[msg.channel.guild.id,
                msg.author.id,result.ronks,result.endindex]);
        }
        if(ronklevel(BASE,oldronks)<ronklevel(BASE,oldronks+result.ronks)){
            levelup(msg,ronklevel(BASE,oldronks+result.ronks));
        }
    });
})()


client.login(process.env.TEST_DISCORD_BOT_TOKEN);
