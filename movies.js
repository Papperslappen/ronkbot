const Discord = require('discord.js');
const { MovieDb } = require('moviedb-promise');
const moviedb = new MovieDb(process.env.TMDB_TOKEN);
const moviedbUrl = "https://www.themoviedb.org/";

var config = {};

function makeMovieEmbed(movie){
    return new Discord.MessageEmbed()
        .setColor('#032541')
        .setTitle(movie.title)
        .setAuthor('TMDB', 'https://i.imgur.com/i65Fw7j.png', "https://www.themoviedb.org/")
        .setURL(`${moviedbUrl}movie/${movie.id}`)
        .setDescription(movie.overview)
        .setThumbnail(`${config.images.base_url}${config.images.poster_sizes[1]}${movie.poster_path}`)
        .setTimestamp()
        .setFooter("This product uses the TMDb API but is not endorsed or certified by TMDb.");
}

module.exports.init = (client,db) => {
    client.once('ready',async ()=>{
        config = await moviedb.configuration().catch(console.err);
        
        //db.run('CREATE TABLE IF NOT EXISTS movie_events ();')

    })
    client.on("message",async (msg)=>{
        if(msg.content.startsWith("!film ")){
            const args = msg.content.trim().split(' ').slice(1).join(' ');
            try{
                const res = await moviedb.searchMovie({ query: args });
                if(res.results.length > 0){
                    const movie = res.results[0];
                    msg.channel.send(makeMovieEmbed(movie));
                }
            }catch(e){
                console.error(e);
                return
            }

        }
    });
}