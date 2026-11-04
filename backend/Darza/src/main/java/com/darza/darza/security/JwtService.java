package com.darza.darza.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey secretKey;
    private final Long expiration;
    public JwtService(
         @Value("${app.jwt.secret}") String secret,
         @Value("${app.jwt.expiration-ms}")Long expiration
    ){
        this.expiration = expiration;
        byte[]keyBytes= Decoders.BASE64.decode(secret);
        this.secretKey= Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String email){
        Date now=new Date();
        Date expirationDate=new Date(now.getTime()+expiration);
        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(secretKey,Jwts.SIG.HS256)
                .compact();
    }
    public String verifyToken(String token){
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
   public Date getTokenExpiration(String token){
       return Jwts.parser()
               .verifyWith(secretKey)
               .build()
               .parseSignedClaims(token)
               .getPayload()
               .getExpiration();
   }
}
