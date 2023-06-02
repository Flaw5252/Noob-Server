<?php
include 'ban.php';
// Rest of your code...





$userIP = $_SERVER['REMOTE_ADDR'];
$bannedIPs = array('104.225.187.36', '174.208.32.180'); // Example banned IP addresses
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
