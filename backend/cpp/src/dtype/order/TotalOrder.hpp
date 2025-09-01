#pragma once
#include <format>
#include <optional>
#include <sstream>
#include <string>
#include <utility>

#include "../../aliases.hpp"

using std::optional, std::string, std::nullopt;

template <typename P>
struct UniquelyDenseTotalOrder {
    using Pos = P;
    /**
     * Usual compare function for sorts: returns negative if a < b in
     * their sort order, positive if a > b.
     */
    virtual i32 compare(const P& a, const P& b) = 0;

    /**
     * Returns a globally unique new position c such that a < c < b.
     *
     * "Globally unique" means that the created position must be distinct
     * from all other created positions, including ones created concurrently
     * by other users.
     *
     * When a is undefined, it is treated as the start of the list, i.e.,
     * this returns c such that c < b. Likewise, undefined b is treated
     * as the end of the list.
     */
    virtual P createBetween(optional<P> a = nullopt, optional<P> b = nullopt) = 0;

    virtual ~UniquelyDenseTotalOrder() = default;
};

class StringTotalOrder : public UniquelyDenseTotalOrder<string> {
   public:
    explicit StringTotalOrder(string replicaId) : replicaId{std::move(replicaId)} {}

    i32 compare(const string& a, const string& b) override { return a.compare(b); }

    string createBetween(optional<string> a = nullopt, optional<string> b = nullopt) override {
        // Create a wholly unique string using a causal dot, i.e. (replicaID, counter)
        std::stringstream uniqueStr;
        uniqueStr << replicaId << counter++;

        // If node is the first ever position in the document
        if (!a.has_value() && !b.has_value()) {
            uniqueStr << "R";
            return uniqueStr.str();
        }

        // If node is the first position at that index
        if (!a.has_value()) {
            return *b + uniqueStr.str() + "R";
        }

        // If node is the last position at that index
        if (!b.has_value()) {
            return *a + uniqueStr.str() + "R";
        }

        const auto isAPrefixOfB = (b->substr(0, a->size())).compare(*a);
        // If a is not a prefix of b append a globally unique new string to a and return that +R
        if (isAPrefixOfB == 0) {
            return *a + uniqueStr.str() + "R";
        } else {
            // If a is a prefix of b replace the R at the end of b with L.
            // Then append a globally unique string to it and return it  +R.
            return (*b).substr(0, b->size() - 1) + "L" + uniqueStr.str() + "R";
        }
    }

    ~StringTotalOrder() override = default;

   private:
    const string replicaId;
    zu counter{};
};
