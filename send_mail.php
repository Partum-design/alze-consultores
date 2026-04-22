<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('ok' => false, 'message' => 'Método no permitido.'));
    exit;
}

$configPath = __DIR__ . '/mail_config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(array('ok' => false, 'message' => 'Configuración SMTP no encontrada.'));
    exit;
}

$config = require $configPath;

$name = trim(isset($_POST['name']) ? $_POST['name'] : '');
$company = trim(isset($_POST['company']) ? $_POST['company'] : '');
$email = trim(isset($_POST['email']) ? $_POST['email'] : '');
$phone = trim(isset($_POST['phone']) ? $_POST['phone'] : '');
$service = trim(isset($_POST['service']) ? $_POST['service'] : '');
$message = trim(isset($_POST['message']) ? $_POST['message'] : '');
$honeypot = trim(isset($_POST['website']) ? $_POST['website'] : '');

if ($honeypot !== '') {
    echo json_encode(array('ok' => true));
    exit;
}

if ($name === '' || $email === '' || $phone === '' || $service === '' || $message === '') {
    http_response_code(422);
    echo json_encode(array('ok' => false, 'message' => 'Faltan campos obligatorios.'));
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(array('ok' => false, 'message' => 'El correo electrónico no es válido.'));
    exit;
}

$serviceMap = array(
    'extintores' => 'Extintores',
    'servicios-electricos' => 'Servicios eléctricos',
    'tableros-automatizacion' => 'Tableros y automatización',
    'instalaciones' => 'Instalaciones',
    'capacitacion' => 'Capacitación',
    'otro' => 'Otro / Consulta General',
);

$serviceLabel = isset($serviceMap[$service]) ? $serviceMap[$service] : ($service !== '' ? $service : 'No especificado');
$subject = 'Nuevo contacto web — GRUPO ALZE';

// Logo URL (Absolute)
$logoUrl = 'https://grupoalze.com.mx/imagenes/logo_empresa/logo_grupoalze.png';

$body = "
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f7f9; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e0e6ed; }
        .header { background-color: #ffffffff; padding: 30px; text-align: center; }
        .header img { max-height: 80px; margin-bottom: 10px; }
        .header h1 { color: #A68256; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 40px; }
        .intro { font-size: 16px; margin-bottom: 25px; color: #555555; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .info-table td { padding: 12px 10px; border-bottom: 1px solid #f0f0f0; font-size: 15px; }
        .label { font-weight: bold; color: #052940; width: 35%; }
        .value { color: #444444; }
        .message-box { background: #f9f9f9; padding: 20px; border-radius: 6px; border-left: 4px solid #A68256; margin-top: 10px; }
        .footer { background-color: #031a2b; color: #ffffff; padding: 20px; text-align: center; font-size: 12px; }
        .footer a { color: #A68256; text-decoration: none; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <img src='{$logoUrl}' alt='Logo Grupo ALZE'>
            <h1>Nuevo Lead Corporativo</h1>
        </div>
        <div class='content'>
            <p class='intro'>Has recibido un nuevo mensaje desde el sitio web oficial de <strong>GRUPO ALZE</strong>.</p>
            
            <table class='info-table'>
                <tr><td class='label'>Cliente:</td><td class='value'>{$name}</td></tr>
                <tr><td class='label'>Empresa:</td><td class='value'>" . ($company !== '' ? $company : 'N/A') . "</td></tr>
                <tr><td class='label'>Email:</td><td class='value'>{$email}</td></tr>
                <tr><td class='label'>Teléfono:</td><td class='value'>{$phone}</td></tr>
                <tr><td class='label'>Servicio:</td><td class='value'>{$serviceLabel}</td></tr>
            </table>

            <p style='font-weight: bold; color: #052940; margin-bottom: 5px;'>Mensaje del Cliente:</p>
            <div class='message-box'>
                " . nl2br(htmlspecialchars($message)) . "
            </div>
        </div>
        <div class='footer'>
            <p>&copy; 2026 GRUPO ALZE | Comercializadora y Mantenimiento Industrial</p>
            <p><a href='https://grupoalze.com.mx'>www.grupoalze.com.mx</a></p>
        </div>
    </div>
</body>
</html>";

try {
    smtp_send_mail($config, $subject, $body, $email, $name);
    echo json_encode(array('ok' => true));
} catch (Exception $e) {
    $raw = $e->getMessage();
    error_log('SMTP Error GRUPO ALZE: ' . $raw);

    $friendlyMessage = 'No se pudo enviar el mensaje por SMTP. Revisa credenciales, puerto 465 SSL y permisos del servidor.';

    if (stripos($raw, 'No Such User Here') !== false || stripos($raw, 'RCPT TO') !== false) {
        $friendlyMessage = 'El correo destino no existe en el servidor del dominio. Verifica el buzón contacto@grupoalze.com.mx en tu panel de correo.';
    } elseif (stripos($raw, 'AUTH') !== false || stripos($raw, '535') !== false || stripos($raw, 'authentication') !== false) {
        $friendlyMessage = 'Error de autenticación SMTP. Por favor, verifica que el usuario y la contraseña en mail_config.php sean correctos.';
    } elseif (stripos($raw, 'STARTTLS') !== false || stripos($raw, 'timed out') !== false || stripos($raw, 'Conexion SMTP fallida') !== false || stripos($raw, 'connection') !== false) {
        $friendlyMessage = 'No se pudo conectar al servidor de correo (Timeout/SSL). Revisa los puertos 465 SSL o 587 TLS en la configuración.';
    } else {
        // En caso de error desconocido, adjuntamos un fragmento del error técnico para ayudar al usuario
        $friendlyMessage .= ' Detalles: ' . substr($raw, 0, 80);
    }

    http_response_code(500);
    echo json_encode(array('ok' => false, 'message' => $friendlyMessage, 'debug' => $raw));
}

function smtp_send_mail($config, $subject, $body, $replyEmail, $replyName)
{
    $host = isset($config['smtp_host']) ? $config['smtp_host'] : '';
    $port = isset($config['smtp_port']) ? (int) $config['smtp_port'] : 465;
    $user = isset($config['smtp_user']) ? $config['smtp_user'] : '';
    $pass = isset($config['smtp_pass']) ? $config['smtp_pass'] : '';
    $fromEmail = isset($config['from_email']) ? $config['from_email'] : $user;
    $fromName = isset($config['from_name']) ? $config['from_name'] : 'Formulario Web';
    $toEmail = isset($config['to_email']) ? $config['to_email'] : $user;
    $secure = isset($config['secure']) ? $config['secure'] : 'ssl';
    $fallbackPort = isset($config['fallback_port']) ? (int) $config['fallback_port'] : 587;
    $fallbackSecure = isset($config['fallback_secure']) ? $config['fallback_secure'] : 'tls';

    if ($host === '' || $user === '' || $pass === '' || $toEmail === '') {
        throw new Exception('Configuración SMTP incompleta.');
    }

    $attempts = array(
        array('port' => $port, 'secure' => $secure),
        array('port' => $fallbackPort, 'secure' => $fallbackSecure),
    );

    $lastException = null;

    foreach ($attempts as $attempt) {
        $socket = null;
        try {
            $socket = smtp_connect_socket($host, (int) $attempt['port'], (string) $attempt['secure']);
            smtp_expect($socket, array(220));
            smtp_cmd($socket, 'EHLO ' . (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'grupoalze.com.mx'), array(250));

            if ($attempt['secure'] === 'tls') {
                smtp_cmd($socket, 'STARTTLS', array(220));
                if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new Exception('No se pudo habilitar STARTTLS.');
                }
                smtp_cmd($socket, 'EHLO ' . (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'grupoalze.com.mx'), array(250));
            }

            smtp_cmd($socket, 'AUTH LOGIN', array(334));
            smtp_cmd($socket, base64_encode($user), array(334));
            smtp_cmd($socket, base64_encode($pass), array(235));
            smtp_cmd($socket, 'MAIL FROM:<' . $fromEmail . '>', array(250));
            smtp_cmd($socket, 'RCPT TO:<' . $toEmail . '>', array(250, 251));
            smtp_cmd($socket, 'DATA', array(354));

            $msgId = '<' . bin2hex(random_bytes(12)) . '@grupoalze.com.mx>';
            $headers = array();
            $headers[] = 'Date: ' . date(DATE_RFC2822);
            $headers[] = 'Message-ID: ' . $msgId;
            $headers[] = 'From: ' . $fromName . ' <' . $fromEmail . '>';
            $headers[] = 'Reply-To: ' . $replyName . ' <' . $replyEmail . '>';
            $headers[] = 'To: <' . $toEmail . '>';
            $headers[] = 'MIME-Version: 1.0';
            $headers[] = 'Content-Type: text/html; charset=UTF-8';
            $headers[] = 'Content-Transfer-Encoding: 8bit';
            $headers[] = 'Subject: ' . encode_header_utf8($subject);

            $safeBody = str_replace(array("\r\n", "\r"), "\n", $body);
            $safeBody = str_replace("\n.", "\n..", $safeBody);
            $payload = implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n", "\r\n", $safeBody) . "\r\n.\r\n";

            fwrite($socket, $payload);
            smtp_expect($socket, array(250));
            smtp_cmd($socket, 'QUIT', array(221));
            fclose($socket);
            return;
        } catch (Exception $inner) {
            $lastException = $inner;
            if (is_resource($socket)) {
                fclose($socket);
            }
        }
    }

    if ($lastException instanceof Exception) {
        throw $lastException;
    }

    throw new Exception('No fue posible enviar por SMTP.');
}

function smtp_connect_socket($host, $port, $secure)
{
    $transportHost = ($secure === 'ssl') ? ('ssl://' . $host) : $host;
    $context = stream_context_create(array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
        ),
    ));

    $socket = @stream_socket_client(
        $transportHost . ':' . $port,
        $errno,
        $errstr,
        20,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!$socket) {
        throw new Exception('Conexion SMTP fallida: ' . $errstr . ' (' . $errno . ')');
    }

    stream_set_timeout($socket, 20);
    return $socket;
}

function smtp_cmd($socket, $command, $okCodes)
{
    fwrite($socket, $command . "\r\n");
    smtp_expect($socket, $okCodes);
}

function smtp_expect($socket, $okCodes)
{
    $response = '';
    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (preg_match('/^\d{3}\s/', $line)) {
            break;
        }
    }

    if ($response === '') {
        throw new Exception('Respuesta vacía del servidor SMTP.');
    }

    $code = (int) substr($response, 0, 3);
    if (!in_array($code, $okCodes, true)) {
        throw new Exception('Respuesta SMTP inesperada: ' . trim($response));
    }
}

function encode_header_utf8($value)
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}
