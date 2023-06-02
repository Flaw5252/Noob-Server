<?php
include 'ban.php';
// Rest of your code...





$userIP = $_SERVER['REMOTE_ADDR'];
$bannedIPs = array(
    '0.0.0.0/8',
    '10.0.0.0/8',
    '100.64.0.0/10',
    '127.0.0.0/8',
    '169.254.0.0/16',
    '172.16.0.0/12',
    '192.0.0.0/24',
    '192.0.0.0/29',
    '192.0.0.8/32',
    '192.0.0.9/32',
    '192.0.0.170/32',
    '192.0.0.171/32',
    '192.0.2.0/24',
    '192.31.196.0/24',
    '192.52.193.0/24',
    '192.88.99.0/24',
    '192.168.0.0/16',
    '192.175.48.0/24',
    '198.18.0.0/15',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '240.0.0.0/4',
    '255.255.255.255/32',
); // Example banned IP addresses
if (in_array($userIP, $bannedIPs)) {
    // Implement the ban: Return an error message or redirect the user to a specific page
    echo "Access denied. Your IP address is banned.";
    exit();
}




$userIP = $_SERVER['REMOTE_ADDR'];

foreach ($bannedIPs as $bannedIP) {
    if (isIPInRange($userIP, $bannedIP)) {
        // Implement the ban: Return an error message or redirect the user to a specific page
        echo "Access denied. Your IP address is banned.";
        exit();
    }
}

// Function to check if the user's IP address is within the banned IP address range
function isIPInRange($userIP, $bannedIP) {
    if (strpos($bannedIP, '/') !== false) {
        list($subnet, $mask) = explode('/', $bannedIP);
        $subnet = ip2long($subnet);
        $mask = ~((1 << (32 - $mask)) - 1);
        $userIP = ip2long($userIP);

        return ($userIP & $mask) === ($subnet & $mask);
    } else {
        return $userIP === ip2long($bannedIP);
    }
}
