#!/bin/bash

echo "=== Admin Configuration Checker ==="
echo ""

# Check .env file
echo "1. Checking .env file..."
if [ -f .env ]; then
    echo "✓ .env file exists"
    
    # Check ADMIN_WALLETS
    if grep -q "ADMIN_WALLETS=" .env; then
        ADMIN_WALLETS=$(grep "ADMIN_WALLETS=" .env | cut -d'=' -f2)
        echo "✓ ADMIN_WALLETS found in .env"
        echo "  Value: $ADMIN_WALLETS"
        
        # Count wallets
        WALLET_COUNT=$(echo "$ADMIN_WALLETS" | tr ',' '\n' | wc -l)
        echo "  Number of admin wallets: $WALLET_COUNT"
        
        # List each wallet
        echo ""
        echo "  Admin wallets:"
        echo "$ADMIN_WALLETS" | tr ',' '\n' | nl
    else
        echo "✗ ADMIN_WALLETS not found in .env"
    fi
else
    echo "✗ .env file not found"
fi

echo ""
echo "2. Checking docker-compose.yml..."
if grep -q "ADMIN_WALLETS:" docker-compose.yml; then
    echo "✓ ADMIN_WALLETS is passed to backend container"
else
    echo "✗ ADMIN_WALLETS is NOT passed to backend container"
    echo "  This is the problem! Backend won't receive the admin wallets."
fi

echo ""
echo "3. Checking if backend is running..."
if docker ps | grep -q qdoge-backend; then
    echo "✓ Backend container is running"
    
    echo ""
    echo "4. Checking environment variables in running container..."
    CONTAINER_ADMIN_WALLETS=$(docker exec qdoge-backend printenv ADMIN_WALLETS 2>/dev/null)
    
    if [ -n "$CONTAINER_ADMIN_WALLETS" ]; then
        echo "✓ ADMIN_WALLETS is set in container"
        echo "  Value: $CONTAINER_ADMIN_WALLETS"
    else
        echo "✗ ADMIN_WALLETS is NOT set in container"
        echo "  You need to restart the backend container!"
    fi
else
    echo "✗ Backend container is not running"
    echo "  Start it with: docker-compose up -d backend"
fi

echo ""
echo "=== Solution ==="
echo "If ADMIN_WALLETS is not in the container, run:"
echo "  docker-compose down"
echo "  docker-compose up -d"
echo ""
echo "Then test by registering your wallet and checking the role."
