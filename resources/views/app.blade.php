<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <title>MBG Bantarjati</title>

    <link rel="icon" href="{{ asset('images/logo.png') }}" type="image/png">
    
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body class="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-[#049DD9] selection:text-white">
    @inertia
</body>
</html>