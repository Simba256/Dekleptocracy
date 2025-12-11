#!/bin/bash
# Generate priority states, then all states sequentially
# This ensures priority data is available quickly while full generation continues

echo "🚀 Starting Sequential Generation"
echo "=================================="
echo ""

# Step 1: Generate priority states (11 states × 4 categories = 44 shocks)
echo "📍 Step 1: Generating Priority States (11 states)"
echo "   Estimated time: ~88 minutes"
echo ""
node scripts/generateAllStates.js priority
PRIORITY_STATUS=$?

if [ $PRIORITY_STATUS -eq 0 ]; then
    echo ""
    echo "✅ Priority states complete!"
    echo ""
    echo "📊 Checking database status..."
    echo ""

    # Brief pause between runs
    sleep 5

    # Step 2: Generate all states (51 states × 4 categories = 204 shocks)
    echo "🌎 Step 2: Generating All States (51 states)"
    echo "   Estimated time: ~7 hours"
    echo "   Note: Priority states will be updated with fresh data"
    echo ""
    node scripts/generateAllStates.js all
    ALL_STATUS=$?

    if [ $ALL_STATUS -eq 0 ]; then
        echo ""
        echo "🎉 COMPLETE! All states generated successfully!"
        echo ""
    else
        echo ""
        echo "⚠️  All states generation had errors (exit code: $ALL_STATUS)"
        echo ""
    fi
else
    echo ""
    echo "❌ Priority states generation failed (exit code: $PRIORITY_STATUS)"
    echo "   Skipping full generation"
    echo ""
    exit 1
fi

echo "✅ Generation pipeline complete!"
echo ""
echo "Next steps:"
echo "  1. Test API: curl http://localhost:5000/api/homepage/wallet-shocks?sortBy=change"
echo "  2. View in browser: http://localhost:5173"
echo "  3. Check logs: tail -f /tmp/priority-generation.log"
echo ""
