<?php

declare(strict_types=1);

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=cmc_sportbooking', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo 'TABLES: '.implode(',', $tables).PHP_EOL;

$rows = $pdo->query('SELECT migration, batch FROM migrations ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $row) {
    echo $row['migration'].'|batch='.$row['batch'].PHP_EOL;
}
