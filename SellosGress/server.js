const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('./db'); // Cambiado a db.js para que coincida con tu archivo
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const axios = require('axios');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const puerto = 3000;
const upload = multer({ storage: multer.memoryStorage() });


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

cloudinary.config({ 
  cloud_name: 'dxz5sofpd', 
  api_key: '441445194795377', 
  api_secret: '2djGq4xgPkWKjUmmUa1epJVhbbM' 
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // Para entender los datos del formulario
// ==========================================
// RUTA MAESTRA PARA RECIBIR PEDIDOS
// ==========================================
app.post('/crear-pedido', upload.single('logoCliente'), (req, res) => {
    // 1. Extraemos los datos (Multer ya hizo su magia y req.body funciona)
    const { sello_id, nombre, telefono, email, especificaciones } = req.body;

    // Si no hay logo, mostramos un error amigable
    if (!req.file) {
        return res.status(400).send("Por favor, adjunta el logo de tu sello.");
    }

    console.log("Subiendo logo a Cloudinary...");

    // 2. PROCESO DE SUBIDA A CLOUDINARY
    let stream = cloudinary.uploader.upload_stream(
        { folder: 'sellos_gress_logos' }, 
        (error, result) => {
            if (error) {
                console.error("Error en Cloudinary:", error);
                return res.status(500).send("Hubo un error al procesar tu imagen.");
            }

            // ¡Éxito! Tenemos la URL segura de la nube
            const urlImagenNube = result.secure_url;
            console.log("✅ Imagen subida con éxito:", urlImagenNube);

            // 3. GUARDAR EN MYSQL CON LA URL DE CLOUDINARY
            const queryPedido = `INSERT INTO pedidos 
                (sello_id, nombre_cliente, telefono, email, especificaciones, url_logo_cloudinary) 
                VALUES (?, ?, ?, ?, ?, ?)`;
            
            const valores = [sello_id, nombre, telefono, email, especificaciones, urlImagenNube];

            db.query(queryPedido, valores, (err, bdResult) => {
                if (err) {
                    console.error("Error al guardar pedido en MySQL:", err);
                    return res.status(500).send("Error crítico al guardar tu pedido.");
                }
                
                // 4. ¡ENVIAR NOTIFICACIÓN A WHATSAPP (GREEN-API)!
                const idInstance = '7107643413'; // Reemplaza esto
                const apiTokenInstance = '81346a73e9f440879557d6685a38d7a4f1348fef97a241ae95'; // Reemplaza esto
                const urlGreenApi = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
                const miNumero = '584241924518@c.us';

                const mensajeAlerta = `🚀 *¡NUEVO PEDIDO WEB!*\n\n👤 *Cliente:* ${nombre}\n📱 *Teléfono:* ${telefono}\n📝 *Detalles:* ${especificaciones}\n\nRevisa tu base de datos para ver el diseño del cliente.`;

                axios.post(urlGreenApi, {
                    chatId: miNumero,
                    message: mensajeAlerta
                })
                .then(() => console.log('✅ ¡WhatsApp enviado vía Green-API!'))
                .catch((err) => console.error('❌ Error enviando WhatsApp:', err));

                // 5. PANTALLA DE ÉXITO PARA EL CLIENTE (con tus colores azul oscuro/gris)
                res.send(`
                    <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
                        <h2 style="color: #2c3e50;">¡Pedido Recibido, ${nombre}!</h2>
                        <p style="color: #546e7a;">Hemos guardado tu diseño correctamente. Nos comunicaremos contigo pronto para la fabricación.</p>
                        <br>
                        <a href="/about" style="padding: 10px 20px; background: #2c3e50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Volver al Catálogo</a>
                    </div>
                `);
            });
        }
    );

    // Iniciar la subida desde la memoria
    streamifier.createReadStream(req.file.buffer).pipe(stream);
});

app.use(express.static(path.join(__dirname, 'public')));

const enviarArchivo = (res, nombreArchivo) => {
    const rutaExacta = path.join(__dirname, 'views', nombreArchivo);
    res.sendFile(rutaExacta, (err) => {
        if (err) {
            console.error(`❌ ALERTA: No se encontró el archivo -> ${nombreArchivo}`);
            res.status(404).send(`Error: No se encontró "${nombreArchivo}" en la carpeta views.`);
        }
    });
};

app.get('/', (req, res) => {
    res.render('index'); 
});

app.get('/index', (req, res) => {
    res.render('index');
});

app.get('/shop', (req, res) => {
    res.render('shop');
});

app.get('/contact', (req, res) => {
    res.render('contactanos');
});

// RUTA DEL CATÁLOGO
app.get('/about', (req, res) => {
    db.query("SELECT * FROM productos_sellos", (err, resultados) => {
        if (err) {
            console.error("Error al obtener productos:", err);
            return res.status(500).send("Error al cargar la base de datos");
        }
        res.render('sellos', { productos: resultados });
    });
});


app.post('/crear-pedido', upload.single('logoCliente'), (req, res) => {
    res.send("¡Pedido procesado con éxito!");
});

app.listen(puerto, () => {
    console.log(`✅ Servidor encendido en http://localhost:${puerto}`);
});

