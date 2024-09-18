// Importar pacotes
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');


// Configurar o aplicativo
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;






// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));





// Configuração do Multer para upload de arquivos
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 MB para arquivos
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado'), false);
        }
    }
});

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost/xmania', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.log(err));

// Schemas do Mongoose
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    isVerified: { type: Boolean, default: false },
    profilePicture: String

});

const User = mongoose.model('User', userSchema);

const tweetSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    image: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});


const Tweet = mongoose.model('Tweet', tweetSchema);

const commentSchema = new mongoose.Schema({
    tweet: { type: mongoose.Schema.Types.ObjectId, ref: 'Tweet' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String
});

const Comment = mongoose.model('Comment', commentSchema);
// HTML para login
const loginHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #1c2938;
             font-family: 'Poppins', sans-serif;
            color: #e9ecef;
        }
        .login-container {
            background-color: #1c2938;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            max-width: 900px;
            margin-top: 50px;
        }
        .login-info {
            background-color: #2c3e50;
            display: flex;
            flex-direction: column;
            justify-content: center;
            color: #e9ecef;
        }
        .login-info h2 {
            font-size: 2rem;
            font-weight: bold;
        }
        .login-info p {
            font-size: 1.1rem;
            margin-top: 10px;
        }
        .login-form {
            padding: 40px;
        }
        .form-label {
            font-weight: 500;
        }
        .input-group-text {
            background-color: #2c3e50;
            border: none;
            color: #e9ecef;
        }
        .form-control {
            background-color: #34495e;
            border: 1px solid #6c757d;
            color: #e9ecef;
        }
        .form-control::placeholder {
            color: #adb5bd;
        }
        .btn-primary {
            background-color: #007bff;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
        }
        .btn-light {
            background-color: #6c757d;
            border-radius: 5px;
            padding: 8px 20px;
            color: #e9ecef;
        }
        .btn-primary:hover {
            background-color: #0056b3;
        }
        .btn-light:hover {
            background-color: #495057;
        }
    </style>
</head>
<body>
    <div class="container d-flex justify-content-center align-items-center">
        <div class="login-container row">
            <div class="col-md-5 login-info text-center p-4">
                <h2>Fazer login</h2>
                <p>Entre com sua conta usando o nome de usuário e senha</p>
            </div>
            <div class="col-md-7 login-form">
                <form action="/login" method="POST">
                    <label for="email" class="form-label">Nome de usuário ou endereço de e-mail</label>
                    <div class="input-group mb-3">
                        <span class="input-group-text" id="basic-addon2">@</span>
                        <input type="email" class="form-control" id="email" name="email" placeholder="Seu email ou nome de usuário" required>
                    </div>

                    <label for="password" class="form-label">Senha</label>
                    <div class="input-group mb-3">
                        <span class="input-group-text" id="basic-addon3">&#128274;</span>
                        <input type="password" class="form-control" id="password" name="password" placeholder="Sua senha" required>
                    </div>

                    <div class="d-flex justify-content-between mb-3">
                        <a href="#" class="btn btn-light">Voltar</a>
                        <a href="#" class="text-muted">Esqueceu?</a>
                    </div>

                    <div class="d-flex justify-content-between">
                        <button type="submit" class="btn btn-primary w-50">Próximo</button>
                        <a href="/register" class="btn btn-light w-50">Registrar</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
`;


// HTML para Registro (Tema Escuro com `#1c2938`)
const registerHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registrar</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #1c2938;
           font-family: 'Poppins', sans-serif;
            color: #e9ecef;
        }
        .register-container {
            background-color: #1c2938;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            max-width: 900px;
            margin-top: 50px;
        }
        .register-info {
            background-color: #2c3e50;
            display: flex;
            flex-direction: column;
            justify-content: center;
            color: #e9ecef;
        }
        .register-info h2 {
            font-size: 2rem;
            font-weight: bold;
        }
        .register-info p {
            font-size: 1.1rem;
            margin-top: 10px;
        }
        .register-form {
            padding: 40px;
        }
        .form-label {
            font-weight: 500;
        }
        .form-control {
            background-color: #34495e;
            border: 1px solid #6c757d;
            color: #e9ecef;
        }
        .form-control::placeholder {
            color: #adb5bd;
        }
        .btn-primary {
            background-color: #007bff;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
        }
        .btn-primary:hover {
            background-color: #0056b3;
        }
        .text-center p {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container d-flex justify-content-center align-items-center">
        <div class="register-container row">
            <div class="col-md-5 register-info text-center p-4">
                <h2>Registrar</h2>
                <p>Crie uma conta preenchendo os dados abaixo</p>
            </div>
            <div class="col-md-7 register-form">
                <form action="/register" method="POST">
                    <div class="mb-3">
                        <label for="name" class="form-label">Nome</label>
                        <input type="text" class="form-control" id="name" name="name" placeholder="Seu nome" required>
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" name="email" placeholder="Seu email" required>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Senha</label>
                        <input type="password" class="form-control" id="password" name="password" placeholder="Sua senha" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Registrar</button>
                    <div class="text-center mt-3">
                        <p>Já tem uma conta? <a href="/login" class="btn btn-light">Entrar</a></p>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
`;




const homeHTML = (user, tweets, recommendedUsers) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
    <nav class="navbar navbar-expand-lg">
        <div class="container-fluid">
            <a class="navbar-brand text-white" href="#">XMANIA</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="#">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Explore</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Notifications</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Messages</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/logout">Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid">
        <div class="row">
            <div class="col-md-3 col-lg-2 sidebar d-none d-md-block">
                <div class="profile-header">
                     <img src="${user.profilePicture || 'https://via.placeholder.com/50'}" alt="Profile Picture" class="rounded-circle">
               <div class="profile-info">
    <h6 class="text-white d-flex align-items-center">
        ${user.name || 'Nome Não Disponível'}
        <img src="https://media.tenor.com/S2U0LSC9evkAAAAj/verified.gif" alt="GIF" class="ms-1" style="width: 20px; height: auto; filter: hue-rotate(217deg) saturate(200%) brightness(1.5);" />
        ${user.isVerified ? '<i class="fa fa-check-circle text-success ms-1" title="Conta Verificada"></i>' : ''}
    </h6>
    <small class="text-white">@${user.email ? user.email.split('@')[0] : 'usuario'}</small>
</div>


                </div>
                <div class="nav flex-column nav-pills mt-2">
                    <a class="nav-link active" href="#">Home</a>
                    <a class="nav-link" href="#">Explorar</a>
                    <a class="nav-link" href="#">Notificações</a>
                 <a class="nav-link" href="/messages">Suas Mensagens</a>

                    <a class="nav-link" href="/profile">Seu Perfil</a>
                    <a class="nav-link" href="#">Itens</a>
                    <a class="nav-link" href="#">Seus Amigos</a>
                    <a class="nav-link" href="#">Mais</a>
                </div>

                <!-- Amigos para Seguir -->
                <div class="mt-3">
                    <h4>Amigos para Seguir</h4>
                    <ul class="list-unstyled">
                        ${recommendedUsers.map(recommended => `
                        <li class="mb-2">
                            <div class="d-flex align-items-center">
                                <img src="${recommended.profilePicture || 'https://via.placeholder.com/50'}" class="rounded-circle" alt="Profile Picture" width="50" height="50">
                                <div class="ms-3">
                                    <h6>${recommended.name || 'Nome Não Disponível'}</h6>
                                    <small class="text-white">@${recommended.email ? recommended.email.split('@')[0] : 'usuario'}</small>
                                    <form action="/follow/${recommended._id}" method="POST" class="mt-2">
                                        <button type="submit" class="btn btn-primary">Follow</button>
                                    </form>
                                </div>
                            </div>
                        </li>
                        `).join('')}
                    </ul>
                </div>
            </div>

            <main class="col-md-9 ms-sm-auto col-lg-8 px-4">
                <div class="mt-4">
                    <div class="card tweet-card">
                        <div class="card-body">
                            <form action="/tweet" method="POST" enctype="multipart/form-data">
                                <div class="mb-3">
                                    <label for="imageUpload" class="btn btn-secondary">
                                        <i class="fa fa-image"></i> Escolher Imagem
                                    </label>
                                    <input type="file" id="imageUpload" name="image" accept="image/*" style="display: none;" onchange="previewImage()">
                                    <div id="imagePreview" class="mt-2"></div>
                                </div>
                                <textarea name="content" class="form-control tweet-input mt-2" rows="3" placeholder="What's happening?"></textarea>
                                <button type="submit" class="btn btn-primary mt-2">Tweet</button>
                            </form>
                        </div>
                    </div>
<!-- Tweets serão carregados aqui -->
${tweets.map(tweet => `
    <div class="card tweet-card mt-3">
        <div class="card-body">
            <div class="tweet-header d-flex align-items-center">
                <img src="${tweet.user?.profilePicture || 'https://via.placeholder.com/50'}" class="rounded-circle" alt="Profile Picture" width="50" height="50">
                <div class="ms-3">
                    <h6 class="d-flex align-items-center">
                        ${tweet.user?.name || 'Nome Não Disponível'}
                        ${tweet.user?.isVerified ? '<img src="https://media.tenor.com/S2U0LSC9evkAAAAj/verified.gif" alt="GIF" class="ms-1" style="width: 20px; height: auto; filter: hue-rotate(60deg) saturate(200%) brightness(1.5);" />' : ''}
                        ${tweet.user?.isVerified ? '<i class="fa fa-check-circle text-success ms-1" title="Conta Verificada"></i>' : ''}
                    </h6>
                    <small class="text-white">@${tweet.user?.email ? tweet.user.email.split('@')[0] : 'usuario'}</small>
                </div>
            </div>
            <p class="mt-2">${tweet.content || 'Conteúdo Não Disponível'}</p>
            ${tweet.image ? `<img src="/uploads/${path.basename(tweet.image)}" class="img-fluid" />` : ''}
            <div class="mt-2 d-flex">
                <form action="/like/${tweet._id}" method="POST" class="me-2">
                    <button type="submit" class="btn btn-link text-decoration-none">
                        <i class="fa fa-heart${tweet.likes.includes(user._id) ? '' : '-o'}"></i> (${tweet.likes.length})
                    </button>
                </form>
                <button class="btn btn-link text-decoration-none me-2" onclick="toggleCommentBox('${tweet._id}')">
                    <i class="fa fa-comment"></i>
                </button>
                <form action="/share/${tweet._id}" method="POST">
                    <button type="submit" class="btn btn-link text-decoration-none">
                        <i class="fa fa-retweet"></i>
                    </button>
                </form>
                <form action="/deleteTweet/${tweet._id}" method="POST" class="me-2">
                    <button type="submit" class="btn btn-link text-decoration-none text-danger">
                        <i class="fa fa-trash"></i>
                    </button>
                </form>
            </div>
            <form action="/comment/${tweet._id}" method="POST" class="mt-2">
                <textarea name="content" class="form-control" rows="2" placeholder="Adicionar um comentário"></textarea>
                <button type="submit" class="btn btn-secondary mt-2">Comentar</button>
            </form>
            <div class="mt-3">
                <h6>Comentários:</h6>
                <div class="comments-section">
                    ${tweet.comments.length > 0 ? tweet.comments.map(comment => `
                        <div class="comment-card d-flex align-items-start mb-2">
                            <img src="${comment.user.profilePicture || 'https://via.placeholder.com/30'}" class="rounded-circle me-2" alt="Profile Picture">
                            <div>
                                <h6 class="d-flex align-items-center">
                                    ${comment.user.name || 'Nome Não Disponível'}
                                    ${comment.user._id === user._id ? `
                                        <img src="https://media.tenor.com/S2U0LSC9evkAAAAj/verified.gif" alt="GIF" class="ms-1" style="width: 15px; height: auto; filter: hue-rotate(60deg) saturate(200%) brightness(1.5);" />
                                        <i class="fa fa-check-circle text-success ms-1" title="Conta Verificada"></i>` : ''}
                                </h6>
                                <p><strong>${comment.user.name || 'Nome Não Disponível'}:</strong> ${comment.content}</p>
                            </div>
                        </div>
                    `).join('') : '<p>Nenhum comentário ainda.</p>'}
                </div>
            </div>
        </div>
    </div>
`).join('')}

                        
                </div>
            </main>

            <!-- Nova coluna para sugestões e notícias -->
            <aside class="col-md-3 col-lg-2 d-none d-md-block">
                <div class="card">
                    <div class="card-body">
                        <h5>Sugestões de Eventos</h5>
                        <ul class="list-unstyled">
                            <li class="mb-2">
                                <h6>Evento 1</h6>
                                <p>Descrição breve do evento.</p>
                            </li>
                            <li class="mb-2">
                                <h6>Evento 2</h6>
                                <p>Descrição breve do evento.</p>
                            </li>
                            <!-- Mais eventos -->
                        </ul>
                    </div>
                </div>
                <div class="card mt-3">
                    <div class="card-body">
                        <h5>Últimas Notícias</h5>
                        <ul class="list-unstyled">
                            <li class="mb-2">
                                <h6>Notícia 1</h6>
                                <p>Resumo da notícia.</p>
                            </li>
                            <li class="mb-2">
                                <h6>Notícia 2</h6>
                                <p>Resumo da notícia.</p>
                            </li>
                            <!-- Mais notícias -->
                        </ul>
                    </div>
                </div>
            </aside>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.7/dist/umd/popper.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js"></script>

    <script>
    function previewImage() {
        const fileInput = document.getElementById('imageUpload');
        const preview = document.getElementById('imagePreview');

        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();

            reader.onload = function(e) {
                // Limpa a área de pré-visualização
                preview.innerHTML = '';
                // Cria um novo elemento de imagem e define o src para a imagem carregada
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = 'Imagem escolhida';
                img.style.display = 'block'; // Garante que a imagem seja exibida como um bloco
                img.style.maxWidth = '100%'; // Limita a largura máxima da imagem
                img.style.maxHeight = '300px'; // Limita a altura máxima da imagem
                img.style.margin = '0 auto'; // Centraliza a imagem horizontalmente
                img.style.borderRadius = '8px'; // Borda arredondada
                preview.appendChild(img);
            };

            reader.readAsDataURL(fileInput.files[0]);
        } else {
            preview.innerHTML = ''; // Limpa a pré-visualização se nenhum arquivo for selecionado
        }
    }
    </script>

</body>
</html>
`;
app.use(session({
    secret: 'your-secret-key', // Mude para uma chave segura
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Defina `true` se usar HTTPS
}));



app.post('/follow/:userId', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { userId } = req.params;
    const currentUserId = req.session.user._id;

    try {
        const userToFollow = await User.findById(userId);
        if (!userToFollow) return res.status(404).send('Usuário não encontrado');

        // Adicionar ou remover o usuário da lista de seguidores e seguindo
        const action = userToFollow.followers.includes(currentUserId) ? '$pull' : '$push';
        await User.findByIdAndUpdate(userId, { [action]: { followers: currentUserId } });
        await User.findByIdAndUpdate(currentUserId, { [action]: { following: userId } });

        res.redirect(`/profile/${userId}`);
    } catch (err) {
        console.error('Erro ao seguir/ deixar de seguir usuário:', err);
        res.status(500).send('Erro interno do servidor');
    }
});


app.get('/index', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const user = req.session.user;
    const tweets = await Tweet.find({})
        .populate('user')
        .populate({
            path: 'comments',
            populate: {
                path: 'user'
            }
        });

    // Obter usuários recomendados (excluindo o usuário atual)
    const recommendedUsers = await User.find({ _id: { $ne: user._id } }).limit(5);

    res.send(homeHTML(user, tweets, recommendedUsers));
});



// Rotas do aplicativo
app.get('/login', (req, res) => {
    res.send(loginHTML);
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        res.redirect('/index');
    } else {
        res.redirect('/login');
    }
});

app.get('/register', (req, res) => {
    res.send(registerHTML);
});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });

    try {
        await user.save();
        req.session.user = user;
        res.redirect('/index');
    } catch (err) {
        res.status(500).send('Error registering user');
    }
});

app.get('/index', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const user = req.session.user;
    const tweets = await Tweet.find({})
        .populate('user')
        .populate({
            path: 'comments',
            populate: {
                path: 'user'
            }
        });

    res.send(homeHTML(user, tweets));
});

app.post('/upload', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const user = req.session.user;
    const filePath = req.file.path;

    // Atualizar a imagem de perfil do usuário
    user.profilePicture = filePath;
    await user.save();

    res.redirect('/index');
});

app.post('/tweet', upload.single('image'), async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { content } = req.body;
    const image = req.file ? req.file.path : null;

    const tweet = new Tweet({
        user: req.session.user._id,
        content,
        image
    });

    await tweet.save();
    res.redirect('/index');
});

app.post('/comment/:tweetId', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { tweetId } = req.params;
    const { content } = req.body;

    const comment = new Comment({
        tweet: tweetId,
        user: req.session.user._id,
        content
    });

    await comment.save();

    // Atualize o tweet com o novo comentário
    await Tweet.findByIdAndUpdate(tweetId, { $push: { comments: comment._id } });

    res.redirect('/index');
});

app.post('/like/:tweetId', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { tweetId } = req.params;
    const userId = req.session.user._id;

    const tweet = await Tweet.findById(tweetId);

    if (tweet.likes.includes(userId)) {
        // Remove o like
        await Tweet.findByIdAndUpdate(tweetId, { $pull: { likes: userId } });
    } else {
        // Adiciona o like
        await Tweet.findByIdAndUpdate(tweetId, { $push: { likes: userId } });
    }

    res.redirect('/index');
});

app.post('/deleteTweet/:tweetId', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { tweetId } = req.params;

    try {
        // Encontrar o tweet para verificar se o usuário é o proprietário
        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            return res.status(404).send('Tweet não encontrado');
        }

        // Verificar se o usuário atual é o proprietário do tweet
        if (tweet.user.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('Você não tem permissão para excluir este tweet');
        }

        // Remover o tweet
        await Tweet.findByIdAndDelete(tweetId);

        // Remover a imagem associada, se houver
        if (tweet.image) {
            fs.unlink(tweet.image, err => {
                if (err) console.error('Erro ao excluir imagem:', err);
            });
        }

        res.redirect('/index');
    } catch (err) {
        console.error('Erro ao excluir tweet:', err);
        res.status(500).send('Erro interno do servidor');
    }
});



const getRecommendedUsers = async (userId) => {
    // Lógica para obter usuários recomendados
    return User.find({ _id: { $ne: userId } }).limit(10);
};





const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);




app.post('/share/:id', async (req, res) => {
    const tweetId = req.params.id;
    const userId = req.session.userId; // ou a maneira que você gerencia a sessão do usuário

    // Encontrar o tweet original
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        return res.status(404).send('Tweet não encontrado');
    }

    // Criar uma nova postagem com o conteúdo do tweet original
    const newTweet = new Tweet({
        content: `Compartilhado de @${tweet.user.email.split('@')[0]}: ${tweet.content}`,
        user: userId,
        // Inclua qualquer outra propriedade necessária, como imagem, etc.
    });

    await newTweet.save();

    res.redirect('/home'); // ou para onde você deseja redirecionar
});







const profileHTML = (user, followers = [], posts = []) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perfil de ${user.username || 'Usuário'}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
    <nav class="navbar navbar-expand-lg">
        <div class="container-fluid">
            <a class="navbar-brand text-white" href="#">XMANIA</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="/index">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Explorar</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Notificações</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Mensagens</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/logout">Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid">
        <div class="row">
            <div class="col-md-3 col-lg-2 sidebar d-none d-md-block">
                <div class="profile-header">
                    <img src="${user.profilePicture || 'https://via.placeholder.com/50'}" alt="Profile Picture" class="rounded-circle">
                    <div class="profile-info">
                        <h6 class="text-white">${user.name || 'Nome Não Disponível'}</h6>
                        <small class="text-white">@${user.email ? user.email.split('@')[0] : 'usuario'}</small>
                    </div>
                </div>
                <div class="nav flex-column nav-pills mt-2">
                    <a class="nav-link" href="/index">Home</a>
                    <a class="nav-link" href="#">Explorar</a>
                    <a class="nav-link" href="#">Notificações</a>
                    <a class="nav-link" href="/messages">Suas Mensagens</a>
                    <a class="nav-link active" href="#">Seu Perfil</a>
                    <a class="nav-link" href="#">Itens</a>
                    <a class="nav-link" href="#">Seus Amigos</a>
                    <a class="nav-link" href="#">Mais</a>
                </div>
            </div>

            <main class="col-md-9 ms-sm-auto col-lg-8 px-4">
                <div class="mt-4">
                    <div class="card tweet-card">
                        <div class="card-body text-center">
                            <img class="profile-pic" src="${user.profilePicture || 'https://via.placeholder.com/150'}" alt="Foto de perfil" id="profilePicMain">
                            <h3>${user.name || user.username || 'Usuário'}</h3>
                            <p>${followers.length} seguidores | ${(user.following || []).length} seguindo | ${posts.length} postagens</p>

                            <!-- Formulário para mudar foto de perfil -->
                            <form action="/updateProfilePicture" method="POST" enctype="multipart/form-data">
                                <label for="imageUpload" class="btn btn-secondary">
                                    <i class="fa fa-image"></i> Mudar Foto de Perfil
                                </label>
                                <input type="file" id="imageUpload" name="profilePicture" accept="image/*" style="display: none;" onchange="previewProfileImage()">
                                <div id="imagePreview" class="mt-2"></div>
                                <button type="submit" class="btn btn-primary mt-2">Salvar</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="mt-4">
                    <h4>Postagens</h4>
                    ${posts.map(post => `
                        <div class="card tweet-card mt-3">
                            <div class="card-body">
                                <div class="tweet-header d-flex align-items-center">
                                    <img src="${post.user?.profilePicture || 'https://via.placeholder.com/50'}" class="rounded-circle" alt="Profile Picture" width="50" height="50">
                                    <div class="ms-3">
                                        <h6>${post.user?.name || 'Nome Não Disponível'}</h6>
                                        <small class="text-white">@${post.user?.email ? post.user.email.split('@')[0] : 'usuario'}</small>
                                    </div>
                                </div>
                                <p class="mt-2">${post.content || 'Conteúdo Não Disponível'}</p>
                                ${post.image ? `<img src="/uploads/${path.basename(post.image)}" class="img-fluid" />` : ''}
                                <div class="mt-2 d-flex">
                                    <form action="/like/${post._id}" method="POST" class="me-2">
                                        <button type="submit" class="btn btn-link text-decoration-none">
                                            <i class="fa fa-heart${post.likes.includes(user._id) ? '' : '-o'}"></i> (${post.likes.length})
                                        </button>
                                    </form>
                                    <button class="btn btn-link text-decoration-none me-2" onclick="toggleCommentBox('${post._id}')">
                                        <i class="fa fa-comment"></i>
                                    </button>
                                    <form action="/share/${post._id}" method="POST">
                                        <button type="submit" class="btn btn-link text-decoration-none">
                                            <i class="fa fa-retweet"></i>
                                        </button>
                                    </form>
                                    <form action="/deletePost/${post._id}" method="POST" class="me-2">
                                        <button type="submit" class="btn btn-link text-decoration-none text-danger">
                                            <i class="fa fa-trash"></i>
                                        </button>
                                    </form>
                                </div>
                                <form action="/comment/${post._id}" method="POST" class="mt-2">
                                    <textarea name="content" class="form-control" rows="2" placeholder="Adicionar um comentário"></textarea>
                                    <button type="submit" class="btn btn-secondary mt-2">Comentar</button>
                                </form>
                                <div class="mt-3">
                                    <h6>Comentários:</h6>
                                    <div class="comments-section">
                                        ${post.comments.length > 0 ? post.comments.map(comment => `
                                            <div class="comment-card d-flex align-items-start mb-2">
                                                <img src="${comment.user.profilePicture || 'https://via.placeholder.com/30'}" class="rounded-circle me-2" alt="Profile Picture">
                                                <p><strong>${comment.user.name || 'Nome Não Disponível'}:</strong> ${comment.content}</p>
                                            </div>
                                        `).join('') : '<p>Nenhum comentário ainda.</p>'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </main>

            <!-- Nova coluna para sugestões e notícias -->
            <aside class="col-md-3 col-lg-2 d-none d-md-block">
                <div class="card">
                    <div class="card-body">
                        <h5>Sugestões de Eventos</h5>
                        <ul class="list-unstyled">
                            <li class="mb-2">
                                <h6>Evento 1</h6>
                                <p>Descrição breve do evento.</p>
                            </li>
                            <li class="mb-2">
                                <h6>Evento 2</h6>
                                <p>Descrição breve do evento.</p>
                            </li>
                            <!-- Mais eventos -->
                        </ul>
                    </div>
                </div>
                <div class="card mt-3">
                    <div class="card-body">
                        <h5>Últimas Notícias</h5>
                        <ul class="list-unstyled">
                            <li class="mb-2">
                                <h6>Notícia 1</h6>
                                <p>Resumo da notícia.</p>
                            </li>
                            <li class="mb-2">
                                <h6>Notícia 2</h6>
                                <p>Resumo da notícia.</p>
                            </li>
                            <!-- Mais notícias -->
                        </ul>
                    </div>
                </div>
            </aside>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.7/dist/umd/popper.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js"></script>

    <script>
    function submitProfilePicture() {
    const formData = new FormData(document.getElementById('profilePictureForm'));

    fetch('/updateProfilePicture', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.json(); // Espera pela resposta JSON
        } else {
            throw new Error('Erro na atualização da foto de perfil');
        }
    })
    .then(data => {
        // Redireciona para a página de perfil
        window.location.href = '/profile'; // Altere para o URL correto da sua página de perfil
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao atualizar a foto de perfil.');
    });
}

    </script>

</body>
</html>
`;



// Criar uma nova sala
app.post('/rooms', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { name, description } = req.body;
    const userId = req.session.user._id;

    const room = new Room({
        name,
        description,
        members: [userId] // O criador da sala é adicionado como membro
    });

    await room.save();
    res.redirect(`/rooms/${room._id}`);
});

// Entrar em uma sala
app.post('/rooms/:roomId/join', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { roomId } = req.params;
    const userId = req.session.user._id;

    const room = await Room.findById(roomId);

    if (!room) return res.status(404).send('Sala não encontrada');

    if (!room.members.includes(userId)) {
        room.members.push(userId);
        await room.save();
    }

    res.redirect(`/rooms/${roomId}`);
});





app.get('/profile/:userId', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { userId } = req.params;
    const currentUserId = req.session.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).send('Usuário não encontrado');

        // Obter seguidores do usuário
        const followers = await User.find({ _id: { $in: user.followers } });

        // Obter postagens do usuário com informações do usuário populadas
        const posts = await Tweet.find({ user: userId })
            .populate('user')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user'
                }
            });

        // Verificar se o usuário atual está seguindo o usuário do perfil
        const isFollowing = user.followers.includes(currentUserId);

        console.log('Profile Picture URL:', user.profilePicture); // Adicione esta linha para depuração

        res.send(profileHTML(user, followers, posts));
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const user = req.session.user;

    try {
        // Carregar o perfil do usuário atual
        const profileUser = await User.findById(user._id);
        if (!profileUser) return res.status(404).send('Usuário não encontrado');

        const tweets = await Tweet.find({ user: user._id })
            .populate('user')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user'
                }
            });

        res.send(profileHTML(profileUser, profileUser.followers, tweets));
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        res.status(500).send('Erro interno do servidor');
    }
});


app.post('/updateProfilePicture', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const userId = req.session.user._id; // ID do usuário da sessão
    const filePath = req.file.path;

    try {
        const user = await User.findById(userId); // Encontrar o usuário usando o ID

        if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

        user.profilePicture = filePath; // Atualizar a foto de perfil
        await user.save(); // Salvar as alterações no banco de dados

        // Redirecionar para a página de perfil após a atualização
        res.redirect('/profile');
    } catch (err) {
        console.error('Erro ao atualizar foto de perfil:', err);
        res.status(500).json({ success: false, message: 'Erro ao atualizar foto de perfil' });
    }
});

app.post('/updateBio', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const user = req.session.user;
    const { bio } = req.body;

    try {
        user.bio = bio;
        await user.save();
        res.redirect(`/profile/${user._id}`);
    } catch (err) {
        console.error('Erro ao atualizar biografia:', err);
        res.status(500).send('Erro ao atualizar biografia');
    }
});







// COLOQUEI TODOS AREA DE CHAT AKI CONVERSAR

const chatSchema = new mongoose.Schema({
    name: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    createdAt: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema);

// Exibir a página de mensagens
app.get('/messages', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    try {
        // Obter todos os chats em que o usuário está envolvido
        const chats = await Chat.find({ users: req.session.user._id }).populate('users');
        res.send(messagesHTML(req.session.user, chats));
    } catch (err) {
        console.error('Erro ao obter mensagens:', err);
        res.status(500).send('Erro interno do servidor');
    }
});

// Exibir um chat específico
app.get('/chat/:chatId', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { chatId } = req.params;

    try {
        // Obter a sala de chat e suas mensagens
        const chat = await Chat.findById(chatId).populate('messages').populate('users');
        if (!chat) return res.status(404).send('Sala de chat não encontrada');

        res.send(chatHTML(req.session.user, chat));
    } catch (err) {
        console.error('Erro ao obter chat:', err);
        res.status(500).send('Erro interno do servidor');
    }
});

// Enviar uma nova mensagem
app.post('/chat/:chatId/message', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { chatId } = req.params;
    const { content } = req.body;

    try {
        const message = new Message({
            sender: req.session.user._id,
            recipient: null, // Não utilizado em salas
            content,
            timestamp: new Date()
        });

        await message.save();

        // Adicionar a mensagem à sala de chat
        await Chat.findByIdAndUpdate(chatId, { $push: { messages: message._id } });

        res.redirect(`/chat/${chatId}`);
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        res.status(500).send('Erro interno do servidor');
    }
});

// Criar uma nova sala de chat
app.post('/createChat', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { name, users } = req.body; // users deve ser um array de IDs de usuários

    try {
        const chat = new Chat({
            name,
            users: [req.session.user._id, ...users] // Incluir o usuário atual e outros
        });

        await chat.save();
        res.redirect('/messages');
    } catch (err) {
        console.error('Erro ao criar sala de chat:', err);
        res.status(500).send('Erro interno do servidor');
    }
});




const messagesHTML = (user, chats) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mensagens</title>
    <link rel="stylesheet" type="text/css" href="styles.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #1c2938;
            color: #e0e0e0;
        }
        .navbar {
            background-color: #102a43;
        }
        .navbar-brand, .nav-link {
            color: #e0e0e0;
        }
        .navbar-nav .nav-link.active {
            color: #4db6ff;
        }
        .container {
            background-color: #102a43;
            padding: 20px;
            border-radius: 8px;
        }
        .card {
            background-color: #1e3a5f;
            border: none;
            border-radius: 8px;
        }
        .message {
            margin-bottom: 10px;
        }
        .message strong {
            color: #4db6ff;
        }
        .message p {
            margin: 0;
        }
        .btn-primary {
            background-color: #4db6ff;
            border: none;
        }
        .btn-primary:hover {
            background-color: #3399ff;
        }
        textarea.form-control {
            background-color: #263238;
            color: #e0e0e0;
            border: none;
            border-radius: 4px;
        }
        textarea.form-control::placeholder {
            color: #e0e0e0;
        }
        .list-group-item {
            background-color: #1e3a5f;
            border: none;
        }
        .list-group-item a {
            color: #e0e0e0;
            text-decoration: none;
        }
        .list-group-item a:hover {
            color: #4db6ff;
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">XMANIA</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item"><a class="nav-link" href="/index">Home</a></li>
                    <li class="nav-item"><a class="nav-link active" href="#">Messages</a></li>
                    <li class="nav-item"><a class="nav-link" href="/profile">Profile</a></li>
                    <li class="nav-item"><a class="nav-link" href="/logout">Logout</a></li>
                </ul>
            </div>
        </div>
    </nav>
    <div class="container mt-4">
        <div class="row">
            <div class="col-md-4">
                <h4>Chats</h4>
                <ul class="list-group">
                    ${chats.map(chat => `
                        <li class="list-group-item">
                            <a href="/chat/${chat._id}">${chat.name}</a>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="col-md-8">
                <h4>Criar Sala de Chat</h4>
                <form action="/createChat" method="POST">
                    <div class="mb-3">
                        <label for="chatName" class="form-label">Nome da Sala</label>
                        <input type="text" class="form-control" id="chatName" name="name" required>
                    </div>
                    <div class="mb-3">
                        <label for="users" class="form-label">Adicionar Usuários</label>
                        <input type="text" class="form-control" id="users" name="users" placeholder="IDs dos usuários separados por vírgula">
                    </div>
                    <button type="submit" class="btn btn-primary">Criar Sala</button>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
`;

const chatHTML = (user, chat) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat - ${chat.name}</title>
    <link rel="stylesheet" type="text/css" href="styles.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #1c2938;
            color: #e0e0e0;
        }
        .navbar {
            background-color: #102a43;
        }
        .navbar-brand, .nav-link {
            color: #e0e0e0;
        }
        .navbar-nav .nav-link.active {
            color: #4db6ff;
        }
        .container {
            background-color: #102a43;
            padding: 20px;
            border-radius: 8px;
        }
        .card {
            background-color: #1e3a5f;
            border: none;
            border-radius: 8px;
        }
        .message {
            margin-bottom: 10px;
        }
        .message strong {
            color: #4db6ff;
        }
        .message p {
            margin: 0;
        }
        .btn-primary {
            background-color: #4db6ff;
            border: none;
        }
        .btn-primary:hover {
            background-color: #3399ff;
        }
        textarea.form-control {
            background-color: #263238;
            color: #e0e0e0;
            border: none;
            border-radius: 4px;
        }
        textarea.form-control::placeholder {
            color: #e0e0e0;
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">XMANIA</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item"><a class="nav-link" href="/index">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="/messages">Messages</a></li>
                    <li class="nav-item"><a class="nav-link" href="/profile">Profile</a></li>
                    <li class="nav-item"><a class="nav-link" href="/logout">Logout</a></li>
                </ul>
            </div>
        </div>
    </nav>
    <div class="container mt-4">
        <h4>Chat: ${chat.name}</h4>
        <div class="card">
            <div class="card-body">
                <div class="messages">
                    ${chat.messages.map(message => `
                        <div class="message">
                            <strong>${message.sender.name}:</strong>
                            <p>${message.content}</p>
                        </div>
                    `).join('')}
                </div>
                <form action="/chat/${chat._id}/message" method="POST">
                    <div class="mb-3">
                        <textarea class="form-control" name="content" rows="3" placeholder="Digite sua mensagem" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Enviar</button>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
`;

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
