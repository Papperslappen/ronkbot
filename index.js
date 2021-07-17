const Discord = require('discord.js');
require('dotenv').config();
var _ = require('lodash');

const sqlite3 = require('sqlite3');
const {open} = require('sqlite');
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

const BASE = 3;

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

function checklevel(msg,ronks){
    msg.channel.send(`${msg.author} - Level ${ronklevel(BASE,ronks)} – ${levelronks(BASE,ronklevel(BASE,ronks)+1)-ronks} ronk until level ${ronklevel(BASE,ronks)+1}`);
}

const client = new Discord.Client({ ws: { intents: ['GUILDS', 'GUILD_MEMBERS','GUILD_MESSAGES','GUILD_PRESENCES'] }});


(async () => {
    // open the database
    const db = await open({
      filename: './folx.db',
      driver: sqlite3.Database
    });

    db.run('CREATE TABLE IF NOT EXISTS folx (server TEXT,user TEXT,score NUM,endindex NUM);')
    
    ////////////MODULES&///////////////////
    require("./dice.js").init(client);
    //require("./movies.js").init(client,db);


    ///////////////////////////////////////

    client.once('ready', async () => {
        console.log('Ready!');
    });
    
    client.on('message', async (msg) => {
        if(msg.author===undefined || msg.channel.guild===undefined){
            return
        }
        if(msg.content.startsWith("!ronk")){
            if(!msg.channel.guild.id){
                return
            }
            var row = await db.get('SELECT * FROM folx WHERE server=? AND user=?;',[
                msg.channel.guild.id,
                msg.author.id,
            ]).catch(console.error);
            if(row){
                checklevel(msg,row.score);
            }
            return
        }
        if(msg.content.startsWith("!topronk")){
            if(!msg.channel.guild){
                return
            }
            console.log("TOPRONK")
            var toplist = await db.all('SELECT CAST(user AS TEXT) AS user,score,endindex FROM folx WHERE server=? ORDER BY score DESC, endindex DESC LIMIT 10;',[
                msg.channel.guild.id,
            ]).catch(console.error);
            const embed=new Discord.MessageEmbed()
                .setColor('#FFCCCC')
                .setTitle('Top Ronk')
                .setThumbnail(msg.client.user.avatarURL);

                for await (r of toplist.map(async (row,index)=>{
                    const member = await msg.channel.guild.members.fetch(row.user).catch(console.error);
                    return {'title':`Plats: ${index+1}`,'text':`Level: ${ronklevel(BASE,row.score)}, Ronk: ${row.score} – ${member.displayName}`}
                })){
                    embed.addField(r.title,r.text);
                }
                
                

            embed.setTimestamp()
                .setFooter('Ronkbot is shamefully presented by Papperslappen');
            msg.channel.send(embed);
            return
        }
        if(msg.content.startsWith("!vaska")){
            var usr = await db.get('SELECT * FROM folx WHERE server=? AND user=?;',[
                msg.channel.guild.id,
                msg.author.id,
            ]).catch(console.error);
            const args = msg.content.slice(1).trim().split(' ');
            if(args.length > 1){
                const arg = Number(args[1]);
                if(!isNaN(arg) && arg<usr.score && arg>=0){
                    const newscore = usr.score - arg;
                    await db.run('UPDATE folx SET score = ? WHERE server = ? AND user=?',[
                        newscore,
                        msg.channel.guild.id,
                        msg.author.id,
                    ]);
                    checklevel(msg,newscore);
                }
            }
            return
        }
        var usr = await db.get('SELECT * FROM folx WHERE server=? AND user=?;',[
            msg.channel.guild.id,
            msg.author.id,
        ]).catch(console.error);
        var ronks = 0;
        var endindex = 0;
        if(usr){
            ronks = usr.score;
            endindex = usr.endindex;
        }
        
        var result = ronkfinder(endindex,msg.content.toLowerCase());
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



if(process.env.PROD){
    client.login(process.env.PROD_DISCORD_BOT_TOKEN);
}else{
    client.login(process.env.TEST_DISCORD_BOT_TOKEN);
}