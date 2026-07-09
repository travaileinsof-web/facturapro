<?php

class Validator {
    /**
     * Assainit une chaîne de caractères pour éviter les attaques XSS.
     * @param string|null $input
     * @return string|null
     */
    public static function sanitizeString($input) {
        if ($input === null) return null;
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Valide et assainit une adresse email.
     * @param string|null $email
     * @return string|null
     */
    public static function sanitizeEmail($email) {
        if ($email === null) return null;
        $cleanEmail = filter_var(trim($email), FILTER_SANITIZE_EMAIL);
        return filter_var($cleanEmail, FILTER_VALIDATE_EMAIL) ? $cleanEmail : null;
    }

    /**
     * Assainit un tableau (utile pour les items de factures).
     * @param array $array
     * @return array
     */
    public static function sanitizeArray(array $array) {
        $clean = [];
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $clean[$key] = self::sanitizeArray($value);
            } elseif (is_string($value)) {
                $clean[$key] = self::sanitizeString($value);
            } else {
                $clean[$key] = $value; // Garde les nombres/booléens intacts
            }
        }
        return $clean;
    }
}
