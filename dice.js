const axios = require('axios')
const sleep = require('util').promisify(setTimeout)

module.exports = {
    init: function(client){
        client.on('message',(msg) => {
          if(msg.content.length <= 20){
            roll(msg).then(console.log).catch(console.err);
          }
        })
    }
}

function find_client_emoji(guild,emojiname){
  const emoji = guild.emojis.cache.find(emoji => emoji.name === emojiname);
  if(emoji){
    return emoji.toString();
  }else{
    return false;
  }
}

function dice_emoji_replace(msg,s2){
  var s = s2;
  if(msg.guild){
    const d4 = find_client_emoji(msg.guild,"d4") || "(d4) ";
    const d6 = find_client_emoji(msg.guild,"d6") || "🎲 ";
    const d8 = find_client_emoji(msg.guild,"d8") || "(d8) ";
    const d10 = find_client_emoji(msg.guild,"d10") || "(d10) ";
    const d20 = find_client_emoji(msg.guild,"d20") || "(d20) ";
    return s.replace(/\(d4\):/g,d4)
             .replace(/\(d6\):/g,d6)
             .replace(/\(d8\):/g,d8)
             .replace(/\(d10\):/g,d10)
             .replace(/\(d20\):/g,d20)
             .replace(/\(d100\):/g,d10+" "+d10);
   } else {
     return s;
   }
}

function format_roll_data(msg,data){
    const formula = dice_emoji_replace(msg,data.formula);
    //const formula = data.formula;
    if(2 <= data.size && data.number_of_rolls <= 15){
      return `${formula} = **${data.result}**`;
    }else{
      return (`${formula}`);
    }

}

async function roll(msg){
  try{
    const response = await axios.get(`https://dice.rennes.se/roll/${msg.content.toLowerCase()}`);
    if(response.data.result && !response.data.trivial){
      let reply = await msg.reply(`🎲${msg.content}🎲`);
      //console.log(`data: ${format_roll_data(msg,response.data)}`);
      await sleep(200);
      await reply.edit(`${format_roll_data(msg,response.data)}`);
    }
}catch(error){
    if(error.response){
          console.error(`Response: ${error.response.status} – ${error.response.data} `);
    }
  }
}