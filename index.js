const https = require("https")
const express = require('express')
const formidable = require('formidable');
const expressLayouts = require('express-ejs-layouts')
const session = require('express-session');
const bodyParser = require('body-parser')
const mysql = require('mysql')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const path = require('path');
const url = require('url');
const fs = require('fs');
const { redirect } = require("express/lib/response");
const { name } = require("ejs");
const app = express()
const saltRounds = 10
const port = 3000


app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.set('view engine','ejs')
app.use(expressLayouts) 
app.use(express.static('public')) 
app.use(express.static(__dirname + '/public'));

app.use(
    session({
        secret: '2C44-4D44-WppQ38S',
        resave: false,
        saveUninitialized: true,
        user: ''
    })
);

const con =  mysql.createConnection({
    host:'localhost',
    user: 'root',
    password: '',
    database: 'node'
})

con.connect(function(err){
    if (err) throw err;
    console.log('Conectado')
})

app.get('/', function(req, res){//página de incio do site sem login
    res.render('index.ejs',{login : [req.session.loggedin], error: req.query.error})
})

app.post('/requestlogin', function(req,res){//código para fazer login
    if(req.body['user']==''){res.redirect('/?error=1')}
    if(req.body['password']==''){res.redirect('/?error=1')}
    user = req.body['user']
    bcrypt.hash(req.body['password'],10, function(err,hash){
        sql = 'select * from tb_users where user = BINARY ?'
        con.query(sql, user, function(err,result){
            if(result[0]==undefined){res.redirect('/?error=2')}else{
            bcrypt.compare(req.body['password'], result[0]['password'], function(err, result) {
                if (err) throw err
                if(result){
                    req.session.loggedin = true;
                    req.session.user = req.body['user'];
                    console.log('logado')
                    res.redirect('/home')
                }else{
                    console.log('login falhou')
                    res.redirect('/')
                }
            })
            }
            if (err) throw err;        
        })
    })
})

app.get('/accountform', function(req,res){//página para fazer cadastro
    res.render('accountform.ejs',{login : [req.session.loggedin], error: req.query.error})
})

app.post('/createaccount', function(req,res){//código para criar uma conta e registra-lá no banco
    if (req.body['name']=='') {res.redirect('/accountform?error=2')}else
    if (req.body['user']=='') {res.redirect('/accountform?error=2')}else
    if (req.body['email']=='' || req.body['email']!=req.body['email2']) {res.redirect('/accountform?error=2')}else
    if (req.body['password']=='') {res.redirect('/accountform?error=2')}else
    if (req.body['password2']!=req.body['password']) {res.redirect('/accountform?error=2')}else{
    
        sql = `select * from tb_users where binary user='${req.body['user']}'`
        con.query(sql, function(err,result){
            if (err) throw err
            if(result[0] !== undefined){
                res.redirect('/accountform?error=1');
            }else{
                sql = `select * from tb_users where email='${req.body['email']}'`
                con.query(sql, function(err,result2){
                    if (err) throw err
                    if(result2[0] !== undefined){
                        res.redirect('/accountform?error=3');
                        return;
                    }else{
                        bcrypt.hash(req.body['password'],10, function(err,hash){
                            sql = `insert into tb_users (name, user, email, password, level, title_1, experience, img) values ('${req.body['name']}','${req.body['user']}','${req.body['email']}','${hash}',1,'Iniciante',0,'Placeholder_user.png')`
                            con.query(sql, function(err,result){
                                if (err) throw err
                                console.log("inserido")
                            })
                            sql = `insert into tb_rank (user, experience) values ('${req.body['user']}',0)`
                            con.query(sql, function(err,result){
                                if (err) throw err
                                console.log("inserido")
                            })
                            res.redirect('/home')
                        })
                    }
                })
            }
        })
    }
});

app.post('/updateaccount', function(req, res){//código para alteração dos dados do usuário
    if(req.session.loggedin){
        if(req.body['password']!==''){
            bcrypt.hash(req.body['password'],10, function(err,hash){
                sql = `update tb_users set name='${req.body['name']}', email='${req.body['email']}', password='${hash}' where binary user='${req.session.user}'`
                con.query(sql, function(err,result){
                    if (err) {res.redirect('/user?erro=1')}
                    else{res.redirect('/user')}
                })
            })
        }else{
            sql = `update tb_users set name='${req.body['name']}', email='${req.body['email']}' where binary user='${req.session.user}'`
            con.query(sql, function(err,result){
                if (err) {res.redirect('/user?erro=1')}
                else{res.redirect('/user')}
            }) 
        }

    }else{res.redirect('/')}
})

app.get('/home', function(req, res){//página de incio do site
    if(req.session.loggedin){
        var sql = 'select * from tb_courses';
        con.query(sql, function(err,result){
            if (err) throw err;

            var sql = 'select genre FROM tb_courses GROUP BY genre'
            con.query(sql, function(err,result2){
                if (err) throw err;

                var sql = `select * FROM tb_users where binary user='${req.session.user}'`
                con.query(sql, function(err,result3){
                    if (err) throw err;

                    var sql = `select * FROM tb_rank`
                    con.query(sql, function(err,result4){
                        if (err) throw err;
                        res.render("home.ejs", {courses: result, genres: result2, user:result3, rank:result4 ,login : [req.session.loggedin]})
                    })
                })
            })
        })
    }else{res.redirect('/')}
})

app.get('/user', function(req, res){//página de dados do usuário
    if(req.session.loggedin){
        var sql = `select * FROM tb_users where binary user='${req.session.user}'`
            con.query(sql, function(err,result){
                if (err) throw err;
                var sql = `select * FROM tb_teacher where binary user='${req.session.user}'`
                con.query(sql, function(err,result2){
                    if (err) throw err;
                    var sql = `select * FROM tb_courses where teacher='${req.session.user}'`
                    con.query(sql, function(err,result3){
                        if (err) throw err;
                        res.render('user.ejs',{login : [req.session.loggedin], user: result, teacher: result2, courses: result3})
                    })
                })
            })
    }else{res.redirect('/')}
})

app.post('/changeimg', function(req, res){//rota para mudar imagem de usuário
    if(req.session.loggedin){
        var form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
            array = []
            array.push(hash +'.'+files.img.mimetype.split('/')[1])
            fs.rename(files.img.filepath, path.join(__dirname, 'public', hash +'.'+files.img.mimetype.split('/')[1]), function (err) {
                if (err) throw err;
                sql = `UPDATE tb_users SET img='${array[0]}' WHERE binary user='${req.session.user}'`
                con.query(sql, function(err,result){
                    if (err) throw err
                    res.redirect('/user')
                })
            })
        })
    }else{res.redirect('/')}
})

app.get('/courseform', function(req, res){//página de criar cursos
    if(req.session.loggedin){
        res.render('coursesform.ejs',{login : [req.session.loggedin]})
    }else{res.redirect('/')}
})

app.post('/createcourse', function(req,res){//código para criar um curto e registra-lo no banco
    if(req.session.loggedin){
        if (req.body['name']=='') {res.redirect('/courseform')}
        if (req.body['genre']=='') {res.redirect('/courseform')}
        if (req.body['desc']=='') {res.redirect('/courseform')}
        if (req.body['experience']=='') {res.redirect('/courseform')}
        if (req.body['qt']=='' || req.body['qt']>50 || req.body['qt']<10) {res.redirect('/courseform')}

        sql = `insert into tb_courses (name, teacher, genre, description, experience, qt_questions, qt_finished) values ('${req.body['name']}','${req.session.user}','${req.body['genre']}','${req.body['desc']}',${req.body['experience']},${req.body['qt']},0)`
        con.query(sql, function(err,result){
            if (err) throw err
        })
        
        sql = `UPDATE tb_teacher SET qt_courses = qt_courses + 1 WHERE binary user='${req.session.user}'`
        con.query(sql, function(err,result){
            if (err) throw err
        })
        var sql = `select id FROM tb_courses where name='${req.body['name']}'`
            con.query(sql, function(err,result){
                if (err) throw err;
                for(x= 0; x<req.body['qt']; x++){
                    sql = `insert into tb_questions (course, number, question, answer1, answer2, answer3, answer4, correct, context) values ('${result[0]['id']}',${x+1},'${req.body['question'+(x+1)+'']}','${req.body[''+(x+1)+'resposta1']}','${req.body[''+(x+1)+'resposta2']}','${req.body[''+(x+1)+'resposta3']}','${req.body[''+(x+1)+'resposta4']}','${req.body['correct'+(x+1)]}','${req.body['context'+(x+1)]}')`
                    con.query(sql, function(err,result){
                        if (err) throw err
                    })
                }
                res.redirect('/home')
            })
    }else{res.redirect('/')}
})

app.get('/teacherform', function(req, res){//página de criar cursos
    if(req.session.loggedin){
        res.render('teacherform.ejs',{login : [req.session.loggedin]})
    }else{res.redirect('/')}
})

app.post('/teacherform', function(req, res){//página de criar cursos
    if(req.session.loggedin){
        var form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
            array = []
            array.push(hash +'.'+files.file.mimetype.split('/')[1])
            fs.rename(files.file.filepath, path.join(__dirname, 'public', hash +'.'+files.file.mimetype.split('/')[1]), function (err) {
                if (err) throw err;
                sql = `insert into tb_teacher (user, qt_courses, validated, cpf, formation, certification) values ('${req.session.user}', 0, False, '${fields.cpf}','${fields.formation}','${array[0]}')`
                con.query(sql, function(err,result){
                    if (err) throw err
                    res.redirect('/user')
                })
            })
        })
    }else{res.redirect('/')}
})

app.get('/viewcourse/:id', function(req,res){
    if(req.session.loggedin){
        sql = `select * from tb_courses where id='${req.params.id}'`
        con.query(sql, function(err,result){
            if (err) throw err

            sql = `select * from tb_users where binary user='${req.session.user}'`
            con.query(sql, function(err,result2){
                if (err) throw err

                sql = `select count(*), score from tb_courses_completed where binary user='${req.session.user}' and course='${req.params.id}' order by dt_ended asc`
                con.query(sql, function(err,progress){
                    if (err) throw err

                    sql = `select count(*) from tb_courses_completed where binary user='${req.session.user}' and course='${req.params.id}' and ended='1'`
                    con.query(sql, function(err,completed){
                        if (err) throw err

                        sql = `select * from tb_rank `
                        con.query(sql, function(err,rank){
                            if (err) throw err

                            sql = `select score from tb_courses_completed where binary user='${req.session.user}' and course='${req.params.id}' order by dt_ended desc `
                            con.query(sql, function(err,score){
                                if (err) throw err
                                res.render('courseview.ejs',{login : [req.session.loggedin], course : result, user : result2, progress : progress, completed : completed, rank:rank, score:score})
                            })
                        })
                    })
                })
            })
        })
    }else{res.redirect('/')}
})

app.get('/course/:id', function(req, res){//página de criar cursos
    if(req.session.loggedin){
        id = req.params.id
        sql = `select * from tb_courses_completed where binary user='${req.session.user}' and course='${id}' and ended=0`
        con.query(sql, function(err,result){
            if (err) throw err
            if(typeof result[0]!=='undefined'){
                res.redirect(`/courseprogress/${req.params.id}`)
            }else{
                d = new Date()
                sql = `insert into tb_courses_completed(course, user, score, dt_started, progress, ended) values ('${id}','${req.session.user}',0,'${d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()}',1, 0)`
                con.query(sql, function(err,result){
                    if (err) throw err
                    res.redirect(`/courseprogress/${req.params.id}`)
                })
            }
        })
    }else{res.redirect('/')}
})

app.get('/courseprogress/:id', function(req, res){//página de criar cursos
    if(req.session.loggedin ){
        sql = `select * from tb_courses_completed where binary user='${req.session.user}' and course='${req.params.id}' and ended='0'`
        con.query(sql, function(err,result){
            if (err) throw err
            if(typeof result[0]==='undefined'){
                res.redirect(`/course/${req.params.id}`)
            }else{
                sql = `select * from tb_questions where course='${req.params.id}' and number='${result[0]['progress']}'`
                con.query(sql, function(err,result){
                    if (err) throw err
                    sql = `select * from tb_users where binary user='${req.session.user}'`
                    con.query(sql, function(err,result2){
                        if (err) throw err
                        sql = `select * from tb_courses where id='${req.params.id}'`
                        con.query(sql, function(err,result3){
                            if (err) throw err
                            res.render('question.ejs',{login : [req.session.loggedin], question: result, user: result2, course : result3})
                        })
                    })
                })
            }
        })
    }else{res.redirect('/')}
})

app.post('/checkanswer',function(req,res){//rota para checar respostas
    if(req.session.loggedin ){
        sql = `select * from tb_courses where id='${req.body['id']}'`
        con.query(sql, function(err,result3){
            if (err) throw err
            sql = `select * from tb_courses_completed where binary user='${req.session.user}' and course='${req.body['id']}'  and ended='0' order by dt_started`
            con.query(sql, function(err,result){
                if (err) throw err
                if(result[0]['progress']==result3[0]['qt_questions']){
                    if(req.body['number']==result[0]['progress']){
                        sql = `select * from tb_questions where number='${req.body['number']}' and course='${req.body['id']}'`
                        con.query(sql, function(err,result2){
                            if (err) throw err
                            if(result2[0]['correct']==req.body['submit']){
                                d = new Date()
                                sql = `update tb_courses_completed set score = score+1, ended = 1, dt_ended = '${d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()}' where binary user='${req.session.user}' and course='${req.body['id']}' and ended='0'`
                                con.query(sql, function(err,result2){
                                    if (err) throw err
                                })
                                sql = `update tb_rank set experience = experience + (${result3[0]['experience']}/${result3[0]['qt_questions']})*${result[0]['score']+1} where binary user='${req.session.user}'`
                                con.query(sql, function(err,result2){
                                    if (err) throw err
                                })
                                res.redirect('/result/'+req.body['id'])

                            }else{
                                d = new Date()
                                sql = `update tb_courses_completed set ended = 1, dt_ended = '${d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()}' where binary user='${req.session.user}' and course='${req.body['id']}' and ended='0'`
                                con.query(sql, function(err,result2){
                                    if (err) throw err
                                })
                                sql = `update tb_rank set experience = experience + (${result3[0]['experience']}/${result3[0]['qt_questions']})*${result[0]['score']} where binary user='${req.session.user}'`
                                con.query(sql, function(err,result2){
                                    if (err) throw err
                                })
                                res.redirect('/result/'+req.body['id'])
                            }
                        })
                    }else{res.redirect('/home')}
                }else{
                    if(req.body['number']==result[0]['progress']){
                        sql = `select * from tb_questions where number='${req.body['number']}' and course='${req.body['id']}'`
                        con.query(sql, function(err,result2){
                            if (err) throw err
                            if(result2[0]['correct']==req.body['submit']){
                                sql = `update tb_courses_completed set progress = progress+1, score = score+1 where binary user='${req.session.user}' and course='${req.body['id']}'  and ended='0'`
                                con.query(sql, function(err,result2){
                                    if (err) throw err
                                    res.redirect('/courseprogress/'+req.body['id'])
                                })

                            }else{
                                sql = `update tb_courses_completed set progress = progress+1 where binary user='${req.session.user}' and course='${req.body['id']}'  and ended='0'`
                                con.query(sql, function(err,result2){
                                    if (err) throw err
                                    res.redirect('/courseprogress/'+req.body['id'])

                                })
                            }
                        })
                    }else{res.redirect('/home')}
                }
            })
        })
    }else{res.redirect('/')}
})

app.get('/result/:id',function(req,res){
    if(req.session.loggedin ){
        sql = `select * from tb_courses where id='${req.params.id}'`
        con.query(sql, function(err,result3){
            if (err) throw err
            sql = `select * from tb_courses_completed where binary user='${req.session.user}' and course='${req.params.id}'  and ended='1' order by dt_ended desc`
            con.query(sql, function(err,result){
                if (err) throw err
                sql = `select * from tb_questions where course='${req.params.id}' and number='10'`
                con.query(sql, function(err,result2){
                    if (err) throw err
                    sql = `select * from tb_users where binary user='${req.session.user}'`
                    con.query(sql, function(err,user){
                        if (err) throw err
                    res.render('result.ejs',{login : [req.session.loggedin], data: result, course : result3, question : result2, user : user})
                    })
                })
            })
        })
    }else{res.redirect('/')}
})

app.get('/ranking', function(req,res){//código para deslogar
    if(req.session.loggedin){
        sql = `select * from tb_users where user='${req.session.user}'`
        con.query(sql, function(err,user){
            if (err) throw err
            sql = `SELECT tb_rank.user, tb_rank.experience, tb_users.name, tb_users.level FROM tb_rank INNER JOIN tb_users ON tb_rank.user = tb_users.user order by experience desc`
            con.query(sql, function(err,result){
                if (err) throw err
                sql = `SELECT user, count(user) from tb_courses_completed group by user`
                con.query(sql, function(err,qt){
                    if (err) throw err
                    res.render('ranking.ejs',{login : [req.session.loggedin], user : user, ranking: result, qt: qt})
                })
            })
        })
    }else{res.redirect("/")}
})

app.get('/logout', function(req,res){//código para deslogar
    if(req.session.loggedin){
        req.session.destroy((err) => {
            if (err) throw err
            res.redirect("/")            
        })
    }else{
        res.redirect("/")
    }
})


var server = app.listen(port)
console.log("Funcionando na porta "+port)
