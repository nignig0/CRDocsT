#pragma once

#include <algorithm>
#include <iterator>
#include <memory>
#include <optional>
#include <ranges>
#include <sstream>
#include <string>
#include <vector>

#include "order/TotalOrder.hpp"
using std::optional, std::string, std::vector;

namespace rg = std::ranges;

constexpr string tombstone = "ð";

template <typename P>
struct FNode {
    P pos;
    optional<string> value;
};

template <typename P>
struct FugueList {
    using State = vector<vector<FNode<P>>>;
    using TotalOrder = std::shared_ptr<UniquelyDenseTotalOrder<P>>;

    explicit FugueList(const TotalOrder& order) : totalOrder{order} {}

    void insert(zu index, const string& value) {
        state.insert(state.begin() + index, vector<FNode<P>>{});

        auto& atIndex = state[index];
        if (index > 0 && index < state.size() - 1) {
            const auto& before = state[index - 1];
            const auto& after = state[index + 1];
            if (atIndex.empty()) {
                atIndex.emplace_back(totalOrder->createBetween(before.back().pos), value);
            } else {
                atIndex.emplace_back(totalOrder->createBetween(atIndex.back().pos, after.back().pos), value);
            }
        } else {
            if (atIndex.empty()) {
                atIndex.emplace_back(totalOrder->createBetween(), value);
            } else {
                atIndex.emplace_back(totalOrder->createBetween(atIndex.back().pos), value);
            }
        }
    }

    void remove(zu index) { state.erase(state.begin() + index, state.begin() + index + 1); }

    string observe() {
        std::stringstream ss;
        for (const auto& idx : state) {
            if (idx.size() > 1) {
                typename State::value_type sorted;
                std::partial_sort_copy(idx.begin(), idx.end(), sorted.begin(), sorted.end(),
                                       [&](const auto& a, const auto& b) {
                                           auto res = totalOrder->compare(a.pos, b.pos);
                                           return res < 0;
                                       });
                vector<string> transformed;
                transformed.reserve(idx.size());
                rg::transform(sorted, std::back_inserter(transformed),
                              [](const auto& node) { return node.value.has_value() ? *(node.value) : tombstone; });
                rg::for_each(transformed, [&ss](const auto& node) { ss << node; });
            } else {
                ss << (idx[0].value.has_value() ? *(idx[0].value) : tombstone);
            }
        }
        return ss.str();
    }

    State state;
    TotalOrder totalOrder;
    zu positionCounter{};
};
