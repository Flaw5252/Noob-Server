<?php
include 'ban.php';
// Rest of your code...
$userIP = $_SERVER['REMOTE_ADDR'];
$bannedIPs = array('127.0.0.1', '192.168.0.1'); // Example banned IP addresses
if (in_array($userIP, $bannedIPs)) {
    // Implement the ban: Return an error message or redirect the user to a specific page
    echo "Access denied. Your IP address is banned.";
    exit();
}
