#include <algorithm>
#include <catch2/catch_all.hpp>
#include <chrono>
#include <memory>
#include <string>
#include <thread>

#include "../src/dtype/FugeList.hpp"
#include "../src/dtype/order/TotalOrder.hpp"
#include "../src/utils/utils.hpp"

using std::string;
using std::thread;

static void simulateUser(FugueList<string>& list, const string& word, int delayBase = 100) {
    zu i{};
    for (auto c : word) {
        std::this_thread::sleep_for(std::chrono::milliseconds(randomInt(delayBase, delayBase + 200)));
        list.insert(i, string(1, c));
        i++;
    }
}

TEST_CASE("FugueList comprehensive functionality", "[fugue][insert][remove][concurrent]") {
    SECTION("Single writer insertion") {
        auto list = FugueList<string>(std::make_shared<StringTotalOrder>(randomString()));
        const string word = "SHADOW WIZARD MONEY GANG";
        simulateUser(list, word, 50);

        auto result = list.observe();
        REQUIRE(result.size() == word.size());

        // Convert word to vector of single-character strings for comparison
        string expected;
        for (char c : word) {
            expected.push_back(c);
        }

        REQUIRE(std::ranges::equal(result, expected));
    }

    SECTION("Single writer deletion") {
        auto list = FugueList<string>(std::make_shared<StringTotalOrder>(randomString()));
        const string word = "SHADOW WIZARD MONEY GANG";
        simulateUser(list, word, 30);

        auto initialSize = list.observe().size();
        list.remove(1);  // remove 'H' (second character)
        auto result = list.observe();

        REQUIRE(result.size() == initialSize - 1);
        REQUIRE(result[0] == 'S');  // First character should still be 'S'
        REQUIRE(result[1] == 'A');  // Third character 'A' should now be at index 1
    }

    SECTION("Multiple writers concurrent insert") {
        auto sharedOrder = std::make_shared<StringTotalOrder>(randomString());
        auto list1 = FugueList<string>(sharedOrder);
        auto list2 = FugueList<string>(sharedOrder);

        const string w1 = "SHADOW WIZARD MONEY GANG";
        const string w2 = "WE LOVE CASTING SPELLS";

        thread t1([&] { simulateUser(list1, w1, 40); });
        thread t2([&] { simulateUser(list2, w2, 60); });
        t1.join();
        t2.join();

        auto result1 = list1.observe();
        auto result2 = list2.observe();

        REQUIRE(result1.size() == w1.size());
        REQUIRE(result2.size() == w2.size());

        // The observations should be identical since they share the same order
        REQUIRE(std::ranges::equal(result1, w1));
        REQUIRE(std::ranges::equal(result2, w2));
    }

    SECTION("Interleaved insert and delete operations") {
        auto list = FugueList<string>(std::make_shared<StringTotalOrder>(randomString()));

        list.insert(0, "A");
        list.insert(1, "B");
        list.insert(2, "C");

        auto initial = list.observe();
        string expectedInitial{"ABC"};
        REQUIRE(std::ranges::equal(initial, expectedInitial));

        list.remove(1);       // delete B
        list.insert(1, "D");  // insert D at same spot

        auto result = list.observe();
        string expectedFinal{"ADC"};
        REQUIRE(std::ranges::equal(result, expectedFinal));
    }
}
