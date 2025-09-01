#pragma once
#include <random>
#include <string>

#include "../aliases.hpp"
using std::string;

inline string randomString(zu length = 10) {
    static thread_local std::mt19937_64 rng(std::random_device{}());
    std::uniform_int_distribution<u8> dist(0, 25);

    string s;
    s.resize(length);
    for (zu i{}; i < length; ++i) s[i] = 97U + dist(rng);
    return s;
}

inline i32 randomInt(i32 min, i32 max) {
    static thread_local std::mt19937_64 rng(std::random_device{}());
    std::uniform_int_distribution<i32> dist(min, max);
    return dist(rng);
}
